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
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e85d4d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> {listing.city}</span>
                {listing.distanceKm != null && <span>• {listing.distanceKm} km</span>}
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={toggleFav} style={{ borderRadius: 999 }} >
              {isFav ? `★ ${t("listing.saved")}` : `☆ Vista`}
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
        </div>

        <aside className="listing-side">
          <div className="side-card price-card">
            <p className="price-line" style={{ margin: 0 }}>
              {formatPrice(listing.priceDaily || listing.priceHourly, listing.currency)}
              <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>
                {" "}/ {listing.priceDaily ? t("listing.perDay") : t("listing.perHour")}
              </span>
            </p>
            <p className="muted small" style={{ margin: "6px 0 14px" }}>
              {t("listing.depositShort")} {formatPrice(listing.depositAmount, listing.currency)} · {t("listing.minimum").replace("{n}", listing.minimumDuration).replace("{unit}", listing.minimumDurationUnit)}
              {listing.instantBooking ? ` · ${t("listing.instant")}` : ` · ${t("listing.requiresApproval")}`}
            </p>
            <div className="field-label" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>TÍMABIL</div>

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
          </div>

          {listing.owner && (
            <div className="side-card owner-card">
              <div className="owner-card-head">
                <div className="owner-card-label">EIGANDI</div>
                <Link to={`/users/${listing.owner.id}`} className="owner-card-main" style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="owner-avatar">
                    {listing.owner.avatar ? <img src={listing.owner.avatar} alt="" /> : <div className="avatar-fallback">👤</div>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>{listing.owner.firstName} {listing.owner.lastName} {listing.owner.identityVerified && <span style={{ color: "#0a7a5a" }}>✔</span>}</div>
                    <div className="muted small" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>★ {Number(listing.owner.rating).toFixed(1)}</span>
                      {listing.ownerProfile && <span>· {listing.ownerProfile.responseRate}% svarhlutfall</span>}
                    </div>
                    {listing.ownerProfile?.createdAt && <div className="muted small">Meðlimur síðan {new Date(listing.ownerProfile.createdAt).toLocaleDateString("is-IS", { month: "long", year: "numeric" })}</div>}
                    <div className="muted small" style={{ display: "flex", alignItems: "center", gap: 4 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> {listing.city}</div>
                    {listing.ownerProfile && <div className="muted small">✓ Samþykkti {listing.ownerProfile.approvedCount || 4} af {listing.ownerProfile.totalCount || 4} beiðnum</div>}
                  </div>
                </Link>
                <div className="owner-card-actions" style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Link to={`/users/${listing.owner.id}`} className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: "center", borderRadius: 10 }}>Prófíll</Link>
                  <Link to={`/search?owner=${listing.owner.id}`} className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: "center", borderRadius: 10 }}>Allar auglýsingar</Link>
                </div>
              </div>
              <div className="owner-card-verify" style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Staðfesting</div>
                <div className="verify-row"><span>✉️ Netfang</span><span style={{ color: "#0a7a5a" }}>✓</span></div>
                <div className="verify-row"><span>📞 Símanúmer</span><span style={{ color: listing.ownerPhone ? "#0a7a5a" : "var(--muted)" }}>{listing.ownerPhone ? "✓" : "—"}</span></div>
              </div>
              <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => { if (!user) navigate("/login?next=" + encodeURIComponent(`/listing/${slug}`)); else if (listing.ownerPhone) window.location.href=`tel:${listing.ownerPhone}`; }}>
                📅 Bóka núna
              </button>
              <button className="btn btn-outline btn-block" style={{ marginTop: 8, background: "#eef6f3", borderColor: "#cce5dc", color: "var(--primary)" }} onClick={() => { if (!user) navigate("/login?next=" + encodeURIComponent(`/listing/${slug}`)); else setMsgOpen(true); }}>
                💬 Senda skilaboð
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