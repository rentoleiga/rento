import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api, formatPrice, timeAgo } from "../api";
import { useAuth } from "../store";
import { useLang } from "../i18n";
import ListingCard from "../components/ListingCard";
import { StarRating } from "../components/ListingCard";

export default function ListingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [mainImg, setMainImg] = useState("");
  const [isFav, setIsFav] = useState(false);
  const [error, setError] = useState("");

  const [dates, setDates] = useState({ start: "", end: "" });
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  useEffect(() => {
    setListing(null);
    api.get(`/api/listings/${slug}?inc=1`)
      .then((d) => {
        setListing(d.listing);
        setMainImg(d.listing.mainImage);
        setIsFav(!!d.listing.isFavorite);
        return api.get(`/api/reviews/listing/${d.listing.id}`);
      })
      .then((d) => setReviews(d.reviews || []))
      .catch(() => setError(t("listing.notFound")));
  }, [slug]);

  useEffect(() => {
    if (!listing) return;
    api.get(`/api/search?category=${listing.categorySlug}&facet=0&per_page=4`)
      .then((d) => setSimilar((d.results || []).filter((l) => l.id !== listing.id).slice(0, 4)))
      .catch(() => {});
  }, [listing]);

  if (error) {
    return <div className="container section"><div className="empty"><h3>{error}</h3></div></div>;
  }
  if (!listing) {
    return <div className="container section"><div className="empty">{t("search.loading")}</div></div>;
  }

  const gallery = listing.gallery && listing.gallery.length ? listing.gallery : [listing.mainImage];

  const submitQuote = (e) => {
    e.preventDefault();
    if (!dates.start || !dates.end) return;
    setQuoting(true);
    const start = new Date(`${dates.start}T10:00:00`).toISOString();
    const end = new Date(`${dates.end}T10:00:00`).toISOString();
    api.post(`/api/bookings/listings/${listing.id}/quote`, { start, end })
      .then(setQuote)
      .catch((err) => setError(err.message))
      .finally(() => setQuoting(false));
  };

  const requestBooking = async () => {
    if (!user) {
      navigate("/login?next=" + encodeURIComponent(`/listing/${slug}`));
      return;
    }
    setSubmitting(true);
    setError("");
    const start = new Date(`${dates.start}T10:00:00`).toISOString();
    const end = new Date(`${dates.end}T10:00:00`).toISOString();
    try {
      const d = await api.post("/api/bookings", {
        listingId: listing.id,
        start,
        end,
        message: `Hello! I would like to book ${listing.title} from ${dates.start} to ${dates.end}.`,
      });
      navigate("/dashboard/bookings");
    } catch (err) {
      setError(err.data?.details?.map((c) => c.status).join(", ") || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFav = async () => {
    if (!user) {
      navigate("/login?next=" + encodeURIComponent(`/listing/${slug}`));
      return;
    }
    try {
      if (isFav) {
        await api.del(`/api/listings/${listing.id}/favorite`);
        setIsFav(false);
      } else {
        await api.post(`/api/listings/${listing.id}/favorite`);
        setIsFav(true);
      }
    } catch {}
  };

  const sendMessage = async () => {
    if (!user) {
      navigate("/login?next=" + encodeURIComponent(`/listing/${slug}`));
      return;
    }
    if (!msgText.trim()) return;
    setMsgSending(true);
    try {
      await api.post("/api/conversations", {
        listingId: listing.id,
        recipientId: listing.owner.id,
        message: msgText.trim(),
      });
      setMsgSent(true);
      setMsgText("");
      setTimeout(() => navigate("/messages"), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setMsgSending(false);
    }
  };

  const attrs = Object.entries(listing.attributes || {}).filter(([k]) => k !== "registration_number");

  return (
    <div className="container section">
      <div className="listing-layout">
        <div>
          <div className="gallery">
            <div className="gallery-main">
              {mainImg ? <img src={mainImg} alt={listing.title} /> : <div className="img-placeholder">Rento</div>}
            </div>
            {gallery.length > 1 && (
              <div className="gallery-thumbs">
                {gallery.map((img) => (
                  <img
                    key={img}
                    src={img}
                    alt=""
                    className={img === mainImg ? "active" : ""}
                    onClick={() => setMainImg(img)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="row" style={{ marginTop: 18, alignItems: "flex-start" }}>
            <div className="grow">
              <h1 className="listing-title">{listing.title}</h1>
              <p className="listing-sub">{listing.subtitle}</p>
              <div className="row" style={{ gap: 16, fontSize: 14, color: "var(--muted)" }}>
                <span><StarRating rating={listing.rating} /> {Number(listing.rating).toFixed(1)} ({listing.reviewCount})</span>
                <span>📍 {listing.city}</span>
                {listing.distanceKm != null && <span>• {listing.distanceKm} km</span>}
              </div>
            </div>
            <button className={`btn ${isFav ? "btn-primary" : "btn-outline"}`} onClick={toggleFav}>
              {isFav ? `★ ${t("listing.saved")}` : `☆ ${t("listing.save")}`}
            </button>
          </div>

          <div className="detail-section">
            <h3>{t("listing.description")}</h3>
            <p className="mb0">{listing.description}</p>
          </div>

          {attrs.length > 0 && (
            <div className="detail-section">
              <h3>{t("listing.specs")}</h3>
              <dl className="spec-grid">
                {attrs.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k.replace(/_/g, " ")}</dt>
                    <dd>{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {listing.owner && (
            <div className="detail-section">
              <h3>{t("listing.owner")}</h3>
              <Link to={`/users/${listing.owner.id}`} className="row owner-box" style={{ textDecoration: "none", color: "inherit" }}>
                {listing.owner.avatar ? <img src={listing.owner.avatar} alt="" /> : <div className="img-placeholder avatar-fallback">O</div>}
                <div className="grow">
                  <strong>{listing.owner.firstName} {listing.owner.lastName}</strong>
                  <div className="muted small">
                    <StarRating rating={listing.owner.rating} /> {Number(listing.owner.rating).toFixed(1)}
                    {listing.ownerProfile && ` · ${listing.ownerProfile.responseRate}%`}
                    {listing.owner.identityVerified && " · ✅ Verified"}
                  </div>
                </div>
              </Link>
              <div className="row" style={{ marginTop: 12, gap: 10 }}>
                {listing.ownerPhone && (
                  <a href={`tel:${listing.ownerPhone}`} className="btn btn-outline grow" style={{ textDecoration: "none", textAlign: "center" }}>
                    📞 {listing.ownerPhone}
                  </a>
                )}
                {user && user.id !== listing.owner.id && (
                  <button className="btn btn-outline grow" onClick={() => setMsgOpen(true)}>
                    {t("listing.messageOwner")}
                  </button>
                )}
                {!user && (
                  <button className="btn btn-outline grow" onClick={() => navigate("/login?next=" + encodeURIComponent(`/listing/${slug}`))}>
                    {t("listing.messageOwner")}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>{t("listing.rules")}</h3>
            <dl className="spec-grid">
              <div><dt>{t("listing.noSmoking")}</dt><dd>{listing.smokingAllowed ? t("word.yes") : t("word.no")}</dd></div>
              <div><dt>{t("listing.noPets")}</dt><dd>{listing.petsAllowed ? t("word.yes") : t("word.no")}</dd></div>
              <div><dt>{t("listing.minAge")}</dt><dd>{listing.minAge || t("word.none")}</dd></div>
              <div><dt>{t("listing.cancel")}</dt><dd className="capitalize">{listing.cancellationPolicy}</dd></div>
              <div><dt>{t("listing.minimumRental")}</dt><dd>{listing.minimumDuration} {listing.minimumDurationUnit}(s)</dd></div>
            </dl>
          </div>

          <div className="detail-section" id="reviews">
            <h3>{t("listing.reviews")} <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>· {reviews.length}</span></h3>
            {reviews.length === 0 ? (
              <p className="muted mb0">{t("listing.noReviews")}</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} style={{ marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid var(--line)" }}>
                  <div className="row" style={{ gap: 8 }}>
                    <StarRating rating={r.rating} />
                    <strong>{r.reviewer.name}</strong>
                    <span className="muted" style={{ fontSize: 13 }}>{timeAgo(r.createdAt)}</span>
                  </div>
                  {r.comment ? (
                    <p className="mb0" style={{ marginTop: 6, fontStyle: "italic" }}>&ldquo;{r.comment}&rdquo;</p>
                  ) : (
                    <p className="muted mb0" style={{ marginTop: 6, fontSize: 13 }}><StarRating rating={r.rating} /> {r.rating}/5 — no comment</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="book-widget">
          <p className="price-line">
            {formatPrice(listing.priceDaily || listing.priceHourly, listing.currency)}
            <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>
              {" "}/ {listing.priceDaily ? t("listing.perDay") : t("listing.perHour")}
            </span>
          </p>
          <p className="muted" style={{ marginTop: 0 }}>
            {t("listing.depositShort")} {formatPrice(listing.depositAmount, listing.currency)} · {t("listing.minimum").replace("{n}", listing.minimumDuration).replace("{unit}", listing.minimumDurationUnit)}
            {listing.instantBooking ? ` · ${t("listing.instant")}` : ` · ${t("listing.requiresApproval")}`}
          </p>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={submitQuote}>
            <div className="field">
              <label>{t("listing.from")}</label>
              <input type="date" required value={dates.start}
                onChange={(e) => setDates({ ...dates, start: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("listing.to")}</label>
              <input type="date" required value={dates.end}
                min={dates.start}
                onChange={(e) => setDates({ ...dates, end: e.target.value })} />
            </div>
            <button className="btn btn-outline btn-block" type="submit" disabled={quoting || !dates.start || !dates.end}>
              {quoting ? t("listing.checking") : t("listing.check")}
            </button>
          </form>

          {quote && (
            <div style={{ marginTop: 14 }}>
              <div className="cost-line"><span>{quote.duration} {quote.durationUnit}(s) × {t("listing.base")}</span><span>{formatPrice(quote.base, listing.currency)}</span></div>
              {quote.cleaningFee > 0 && <div className="cost-line"><span>{t("listing.cleaning")}</span><span>{formatPrice(quote.cleaningFee, listing.currency)}</span></div>}
              {quote.deliveryFee > 0 && <div className="cost-line"><span>{t("listing.delivery")}</span><span>{formatPrice(quote.deliveryFee, listing.currency)}</span></div>}
              {quote.pickupFee > 0 && <div className="cost-line"><span>{t("listing.pickup")}</span><span>{formatPrice(quote.pickupFee, listing.currency)}</span></div>}
              {quote.extraFees - quote.cleaningFee - quote.deliveryFee - quote.pickupFee > 0 && (
                <div className="cost-line"><span>{t("listing.other")}</span><span>{formatPrice(quote.extraFees - quote.cleaningFee - quote.deliveryFee - quote.pickupFee, listing.currency)}</span></div>
              )}
              <div className="cost-line total"><span>{t("listing.total")}</span><span>{formatPrice(quote.total, listing.currency)}</span></div>
              <div className="cost-line muted"><span>{t("listing.deposit")}</span><span>{formatPrice(quote.deposit, listing.currency)}</span></div>
              <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} disabled={submitting} onClick={requestBooking}>
                {submitting ? t("listing.sending") : (listing.instantBooking ? t("listing.bookNow") : t("listing.request"))}
              </button>
            </div>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <div className="section" style={{ paddingBottom: 0 }}>
          <div className="section-head"><h2>{t("listing.similar")}</h2></div>
          <div className="grid">{similar.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
        </div>
      )}

      {msgOpen && (
        <div className="modal-overlay" onClick={() => { setMsgOpen(false); setMsgSent(false); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{t("listing.messageOwner")}</h3>
            {msgSent ? (
              <div className="empty" style={{ padding: "20px 0" }}>
                <p>{t("listing.messageSent")}</p>
              </div>
            ) : (
              <>
                <div className="field">
                  <textarea
                    rows={4}
                    placeholder={t("listing.messagePlaceholder")}
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>
                <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
                  <button className="btn btn-outline" onClick={() => setMsgOpen(false)}>{t("listing.cancel")}</button>
                  <button className="btn btn-primary" disabled={msgSending || !msgText.trim()} onClick={sendMessage}>
                    {msgSending ? t("listing.sending") : t("listing.sendMessage")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}