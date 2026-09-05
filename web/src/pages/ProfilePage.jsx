import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, timeAgo } from "../api";
import { useAuth } from "../store";
import { useLang } from "../i18n";
import { StarRating } from "../components/ListingCard";
import ListingCard from "../components/ListingCard";

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState("");
  const [msgOpen, setMsgOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  useEffect(() => {
    api.get(`/api/users/${id}`)
      .then((d) => { setProfile(d.user); setListings(d.listings || []); })
      .catch((e) => setError(e.message));
    api.get(`/api/reviews/user/${id}`)
      .then((d) => setReviews(d.reviews || []))
      .catch(() => {});
  }, [id]);

  if (error) return <div className="container section"><div className="empty"><h3>{error}</h3></div></div>;
  if (!profile) return <div className="container section"><div className="empty">Loading…</div></div>;

  const startMessage = (listing) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setSelectedListing(listing);
    setMsgOpen(true);
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !selectedListing) return;
    setMsgSending(true);
    try {
      await api.post("/api/conversations", {
        listingId: selectedListing.id,
        recipientId: profile.id,
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

  return (
    <div className="container section" style={{ maxWidth: 940 }}>
      <div className="detail-section" style={{ marginTop: 0, display: "flex", gap: 16, alignItems: "center" }}>
        {profile.avatar ? (
          <img src={profile.avatar} alt="" style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div className="img-placeholder avatar-fallback" style={{ width: 84, height: 84, borderRadius: "50%", fontSize: 30 }}>
            {(profile.firstName || "U")[0]}
          </div>
        )}
        <div className="grow">
          <h1 className="mt0 mb0" style={{ fontSize: 24 }}>{profile.fullName}</h1>
          <div className="muted">{profile.city}{profile.role === "admin" ? " · Admin" : ""}</div>
          <div className="row" style={{ gap: 14, marginTop: 6, fontSize: 14 }}>
            <span><StarRating rating={profile.rating} /> {Number(profile.rating).toFixed(1)} ({profile.reviewCount})</span>
            {profile.identityVerified && <span>Identity verified</span>}
            {profile.businessVerified && <span>Business verified</span>}
            {profile.responseRate > 0 && <span>{profile.responseRate}% response rate</span>}
            <span className="muted">Member since {timeAgo(profile.memberSince)}</span>
          </div>
          {user && user.id !== profile.id && listings.length > 0 && (
            <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => startMessage(listings[0])}>
              {t("listing.sendMessage")}
            </button>
          )}
        </div>
      </div>

      {profile.bio && (
        <div className="detail-section">
          <h3>About</h3>
          <p className="mb0">{profile.bio}</p>
        </div>
      )}

      {listings.length > 0 && (
        <div className="section" style={{ paddingBottom: 0 }}>
          <div className="section-head"><h2>Listings</h2></div>
          <div className="grid">{listings.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
        </div>
      )}

      <div className="section" style={{ paddingBottom: 0 }}>
        <div className="section-head"><h2>Reviews <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>· {reviews.length}</span></h2></div>
        {reviews.length === 0 ? (
          <div className="detail-section" style={{ marginTop: 10 }}><p className="muted mb0">No reviews yet — after a completed rental both parties can leave a rating and comment visible to everyone.</p></div>
        ) : reviews.map((r) => (
          <div key={r.id} className="detail-section" style={{ marginTop: 10 }}>
            <div className="row" style={{ gap: 8 }}>
              <StarRating rating={r.rating} />
              <strong>{r.reviewer.name}</strong>
              <span className="muted" style={{ fontSize: 13 }}> · {timeAgo(r.createdAt)}</span>
            </div>
            {r.comment ? (
              <p className="mb0" style={{ marginTop: 6, fontStyle: "italic" }}>&ldquo;{r.comment}&rdquo;</p>
            ) : (
              <p className="muted mb0" style={{ marginTop: 6, fontSize: 13 }}>{r.rating}/5 — no comment</p>
            )}
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>for &ldquo;{r.listingTitle}&rdquo;</div>
          </div>
        ))}
      </div>

      {msgOpen && (
        <div className="modal-overlay" onClick={() => { setMsgOpen(false); setMsgSent(false); setSelectedListing(null); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{t("listing.messageOwner")}</h3>
            {selectedListing && <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>Re: {selectedListing.title}</p>}
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
                  <button className="btn btn-outline" onClick={() => { setMsgOpen(false); setSelectedListing(null); }}>{t("listing.cancel")}</button>
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