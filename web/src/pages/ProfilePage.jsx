import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, timeAgo } from "../api";
import { StarRating } from "../components/ListingCard";
import ListingCard from "../components/ListingCard";

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState("");

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
    </div>
  );
}