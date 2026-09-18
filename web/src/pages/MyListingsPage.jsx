import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatPrice } from "../api";
import { useAuth } from "../store";

const TIERS = [
  { key: "silver", label: "Silfur", price: 250 },
  { key: "gold", label: "Gull", price: 500 },
  { key: "platinum", label: "Platína", price: 1000 },
];
const TIER_LABEL = { featured: "Silfur", gold: "Gull", platinum: "Platína" };

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
    if (!window.confirm(`Eyða "${l.title}"?`)) return;
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
    if (!window.confirm("Fjarlægja kynningu af þessari skráningu?")) return;
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
        <h1 className="mt0">Skráningar mínar</h1>
        <Link className="btn btn-primary" to="/dashboard/listings/new">+ Ný skráning</Link>
      </div>

      {loading ? <div className="empty">Hleður…</div>
        : rows.length === 0 ? (
            <div className="empty">
              <h3>Engar skráningar ennþá</h3>
              <p>Skráðu hlutina þína og byrjaðu að græða.</p>
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
                        {l.categoryName} · {formatPrice(l.priceDaily || l.priceHourly, l.currency)}/{l.priceDaily ? "dag" : "klst"}
                        {l.depositAmount > 0 && ` · trygging ${formatPrice(l.depositAmount, l.currency)}`}
                      </div>
                      <div className="sub">{l.viewCount} skoðanir · {l.favoriteCount} vistuð</div>
                    </div>
                    <span className={`status-pill status-${l.status}`}>{l.status}</span>
                    <div className="row">
                      <Link className="btn btn-outline btn-sm" to={`/dashboard/calendar/${l.id}`}>Dagatal</Link>
                      <Link className="btn btn-outline btn-sm" to={`/dashboard/listings/${l.id}`}>Breyta</Link>
                      <button
                        className={`btn btn-sm ${l.promotionTier && l.promotionTier !== "none" ? "btn-gold" : "btn-outline"}`}
                        onClick={() => {
                          setOpenPromo(openPromo === l.id ? null : l.id);
                        }}
                      >
                        {l.promotionTier && l.promotionTier !== "none" ? `★ ${TIER_LABEL[l.promotionTier]}` : "Premium ↑"}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(l)}>Eyða</button>
                    </div>
                  </li>
                  {openPromo === l.id && (
                    <li className="promo-panel">
                      <div className="promo-head">
                        <strong>Efla “{l.title}”</strong>
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
                            <span className="muted">{t.price} ISK / 7 daga</span>
                          </button>
                        ))}
                      </div>
                      <div className="promo-actions">
                        <button className="btn btn-primary" disabled={busyPromo} onClick={() => promote(l)}>
                          {busyPromo ? "Virkja…" : `Virkja ${TIERS.find((t) => t.key === pickTier)?.label}`}
                        </button>
                        {l.promotionTier && l.promotionTier !== "none" && (
                          <button className="btn btn-outline" onClick={() => removePromo(l)}>Fjarlægja kynningu</button>
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