import React, { useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../api";
import { api } from "../api";
import { useAuth } from "../store";

const TIER_BADGE = {
  platinum: "Platinum",
  gold: "Gold",
  featured: "Silver",
};

export default function ListingCard({ listing }) {
  const { user } = useAuth();
  const [fav, setFav] = useState(!!listing.isFavorite);
  const [busy, setBusy] = useState(false);

  const toggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/login?next=" + encodeURIComponent(`/listing/${listing.slug}`);
      return;
    }
    setBusy(true);
    try {
      if (fav) {
        await api.del(`/api/listings/${listing.id}/favorite`);
        setFav(false);
      } else {
        await api.post(`/api/listings/${listing.id}/favorite`);
        setFav(true);
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const tier = listing.promotionTier && listing.promotionTier !== "none" ? listing.promotionTier : null;
  const tierClass = tier === "featured" ? "silver" : tier;

  return (
    <Link to={`/listing/${listing.slug}`} className="card listing-card">
      <div className="card-img-wrap">
        {listing.mainImage ? (
          <img src={listing.mainImage} alt={listing.title} loading="lazy" />
        ) : (
          <div className="img-placeholder">Rento</div>
        )}
        <div className="card-badges">
          {listing.verificationStatus === "verified" && (
            <span className="badge badge-verified">Verified</span>
          )}
          {tier && <span className={`badge badge-tier badge-${tierClass}`}>{TIER_BADGE[tier]}</span>}
        </div>
        <button
          type="button"
          className={`card-fav ${fav ? "is-fav" : ""}`}
          onClick={toggleFav}
          aria-label={fav ? "Remove from wishlist" : "Add to wishlist"}
          disabled={busy}
        >
          <HeartIcon filled={fav} />
        </button>
      </div>
      <div className="card-body">
        <h3 className="card-title">{listing.title}</h3>
        <div className="card-rating">
          <StarRating rating={listing.rating} />
          <span className="muted">
            {Number(listing.rating).toFixed(1)} ({listing.reviewCount})
          </span>
        </div>
        <div className="card-meta">
          <span>{listing.city}</span>
          {listing.distanceKm != null && <span>• {listing.distanceKm} km</span>}
        </div>
        <div className="card-price">
          <PriceLine listing={listing} />
        </div>
      </div>
    </Link>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  );
}

export function PriceLine({ listing }) {
  const daily = listing.priceDaily;
  if (daily != null) {
    return (
      <span>
        <strong>{formatPrice(daily, listing.currency)}</strong>
        <span className="muted"> / day</span>
      </span>
    );
  }
  if (listing.priceHourly != null) {
    return (
      <span>
        <strong>{formatPrice(listing.priceHourly, listing.currency)}</strong>
        <span className="muted"> / hour</span>
      </span>
    );
  }
  return <span className="muted">Price on request</span>;
}

export function StarRating({ rating }) {
  const r = Number(rating) || 0;
  return (
    <span className="stars" aria-label={`${r} out of 5`}>
      {"★".repeat(Math.round(r))}
      <span className="stars-ghost">{"★".repeat(5 - Math.round(r))}</span>
    </span>
  );
}