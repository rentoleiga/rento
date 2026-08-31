import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatPrice } from "../api";
import { useAuth } from "../store";

const TIERS = [
  { key: "silver", label: "Silver", price: 250 },
  { key: "gold", label: "Gold", price: 500 },
  { key: "platinum", label: "Platinum", price: 1000 },
];
const TIER_LABEL = { featured: "Silver", gold: "Gold", platinum: "Platinum" };

export default function MyListingsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPromo, setOpenPromo] = useState(null);
  const [pickTier, setPickTier] = useState("platinum");
  const [busyPromo, setBusyPromo] = useState(false);

  const load = () => {
    api.get("/api/dashboard/owner/listings").then((d) => setRows(d.listings)).catch(() => []).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const del = async (l) => {
    if (!window.confirm(`Delete "${l.title}"?`)) return;
    try {
      await api.del(`/api/listings/${l.id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const promote = async (l) => {
    setBusyPromo(true);
    try {
      await api.post(`/api/listings/${l.id}/promote`, { tier: pickTier, days: 7 });
      setOpenPromo(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyPromo(false);
    }
  };

  const removePromo = async (l) => {
    if (!window.confirm("Remove the promotion from this listing?")) return;
    try {
      await api.del(`/api/listings/${l.id}/promote`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container section" style={{ maxWidth: 880 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
        <h1 className="mt0">My listings</h1>
        <Link className="btn btn-primary" to="/dashboard/listings/new">+ New listing</Link>
      </div>

      {loading ? <div className="empty">Loading…</div>
        : rows.length === 0 ? (
            <div className="empty">
              <h3>No listings yet</h3>
              <p>List your items and start earning.</p>
            </div>
          ) : (
            <ul className="plain-list">
              {rows.map((l) => (
                <React.Fragment key={l.id}>
                  <li>
                    {l.mainImage ? <img src={l.mainImage} alt="" /> : <div className="img-placeholder" style={{ width: 56, height: 42 }}>I</div>}
                    <div className="grow">
                      <div className="title">
                        <Link to={`/listing/${l.slug}`}>{l.title}</Link>
                        {l.promotionTier &&
                          l.promotionTier !== "none" && (
                            <span className={`badge badge-tier badge-${l.promotionTier === "featured" ? "silver" : l.promotionTier}`}>
                              {TIER_LABEL[l.promotionTier]}
                            </span>
                          )}
                      </div>
                      <div className="sub">
                        {l.categoryName} · {formatPrice(l.priceDaily || l.priceHourly, l.currency)}/{l.priceDaily ? "day" : "hour"}
                        {l.depositAmount > 0 && ` · deposit ${formatPrice(l.depositAmount, l.currency)}`}
                      </div>
                      <div className="sub">{l.viewCount} views · {l.favoriteCount} saves</div>
                    </div>
                    <span className={`status-pill status-${l.status}`}>{l.status}</span>
                    <div className="row">
                      <Link className="btn btn-outline btn-sm" to={`/dashboard/calendar/${l.id}`}>Calendar</Link>
                      <Link className="btn btn-outline btn-sm" to={`/dashboard/listings/${l.id}`}>Edit</Link>
                      <button
                        className={`btn btn-sm ${l.promotionTier && l.promotionTier !== "none" ? "btn-gold" : "btn-outline"}`}
                        onClick={() => {
                          setOpenPromo(openPromo === l.id ? null : l.id);
                        }}
                      >
                        {l.promotionTier && l.promotionTier !== "none" ? `★ ${TIER_LABEL[l.promotionTier]}` : "Premium ↑"}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(l)}>Delete</button>
                    </div>
                  </li>
                  {openPromo === l.id && (
                    <li className="promo-panel">
                      <div className="promo-head">
                        <strong>Promote “{l.title}”</strong>
                        <button className="btn btn-sm" onClick={() => setOpenPromo(null)}>✕</button>
                      </div>
                      <div className="promo-tiers">
                        {TIERS.map((t) => (
                          <button
                            key={t.key}
                            className={`promo-opt promo-opt-${t.key} ${pickTier === t.key ? "active" : ""}`}
                            onClick={() => setPickTier(t.key)}
                          >
                            <strong>{t.label}</strong>
                            <span className="muted">{t.price} ISK / 7 days</span>
                          </button>
                        ))}
                      </div>
                      <div className="promo-actions">
                        <button className="btn btn-primary" disabled={busyPromo} onClick={() => promote(l)}>
                          {busyPromo ? "Activating…" : `Activate ${TIERS.find((t) => t.key === pickTier)?.label}`}
                        </button>
                        {l.promotionTier && l.promotionTier !== "none" && (
                          <button className="btn btn-outline" onClick={() => removePromo(l)}>Remove promotion</button>
                        )}
                      </div>
                    </li>
                  )}
                </React.Fragment>
              ))}
            </ul>
          )}
    </div>
  );
}