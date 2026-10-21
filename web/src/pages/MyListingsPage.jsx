import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatPrice } from "../api";
import { fmtDate } from "../lib/dates";

const TIER_LABEL = { silver: "Silfur", featured: "Silfur", gold: "Gull", platinum: "Platína" };
const DAY = 86400000;

const activePromo = (l) =>
  !!l.promotionTier &&
  l.promotionTier !== "none" &&
  !!l.promotionUntil &&
  new Date(l.promotionUntil).getTime() > Date.now();
const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY));
const daysLabel = (iso) => {
  const d = daysLeft(iso);
  if (d <= 0) return "rennur út í dag";
  return `rennur út eftir ${d} ${d === 1 ? "dag" : "daga"}`;
};
export default function MyListingsPage() {
  const [rows, setRows] = useState([]);
  const [archivedRows, setArchivedRows] = useState([]);
  const [tab, setTab] = useState("active");
  const [slots, setSlots] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/api/dashboard/owner/listings").then((d) => d.listings).catch(() => []),
      api.get("/api/dashboard/owner/listings?archived=1").then((d) => d.listings).catch(() => []),
      api.get("/api/slots").catch(() => null),
    ])
      .then(([listings, archived, slotData]) => {
        setRows(listings || []);
        setArchivedRows(archived || []);
        setSlots(slotData);
      })
      .finally(() => setLoading(false));
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

  const republish = async (l) => {
    try {
      await api.put(`/api/listings/${l.id}`, { publish: true });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const deletePermanent = async (l) => {
    if (!window.confirm(`Eyða "${l.title}" varanlega? Þetta er ekki hægt að afturkalla.`)) return;
    try {
      await api.del(`/api/listings/${l.id}/permanent`);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const statusLabel = (status) => {
    if (status === "expired") return "Útrunnið";
    if (status === "deleted") return "Eytt";
    return status;
  };

  return (
    <div className="container section" style={{ maxWidth: 880 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
        <h1 className="mt0">Skráningar mínar</h1>
        <Link className="btn btn-primary" to="/dashboard/listings/new">+ Ný skráning</Link>
      </div>

      <div className="dash-nav" style={{ marginBottom: 18 }}>
        <button className={`nav-link ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>
          Virkar ({rows.length})
        </button>
        <button className={`nav-link ${tab === "archive" ? "active" : ""}`} onClick={() => setTab("archive")}>
          Safn ({archivedRows.length})
        </button>
      </div>

      {slots && tab === "active" && (
        <div className="slots-panel">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong>Auglýsingapláss</strong>
            <Link className="btn btn-outline btn-sm" to="/promote">+ Kaupa pláss</Link>
          </div>
          <div className="slot-squares">
            {Array.from({ length: slots.freeSlots }).map((_, i) => (
              <span
                key={`free-${i}`}
                className={`slot-sq ${i < slots.freeUsed ? "sq-free-used" : "sq-free"}`}
                title={i < slots.freeUsed ? "Ókeypis — í notkun" : "Ókeypis — laust"}
              />
            ))}
            {slots.slots.map((s) => (
              <span
                key={s.id}
                className={`slot-sq ${s.available ? "sq-avail" : "sq-used"}`}
                title={s.available ? "Laust" : s.title || "Í notkun"}
              />
            ))}
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            {slots.freeUsed}/{slots.freeSlots} ókeypis í notkun · {slots.available} keypt laust · {slots.boughtTotal} keypt alls
          </div>
          {slots.slots.length > 0 && (
            <ul className="slot-list">
              {slots.slots.map((s) => (
                <li key={s.id}>
                  <span className={`slot-sq ${s.available ? "sq-avail" : "sq-used"}`} style={{ marginRight: 8 }} />
                  {s.available ? (
                    <>
                      (laust) – <Link to="/dashboard/listings/new">Setja inn auglýsingu</Link>
                    </>
                  ) : (
                    <>
                      {s.title} – {s.expiresAt ? daysLabel(s.expiresAt) : ""}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {loading ? (
        <div className="empty">Hleður…</div>
      ) : tab === "active" ? (
        rows.length === 0 ? (
          <div className="empty">
            <h3>Engar virkar skráningar</h3>
            <p>Skráðu hlutina þína og byrjaðu að græða.</p>
          </div>
        ) : (
          <ul className="plain-list">
            {rows.map((l) => (
              <li key={l.id}>
                {l.mainImage ? (
                  <img src={l.mainImage} alt="" />
                ) : (
                  <div className="img-placeholder" style={{ width: 56, height: 42 }}>I</div>
                )}
                <div className="grow">
                  <div className="title">
                    <Link to={`/listing/${l.slug}`}>{l.title}</Link>
                    {activePromo(l) && (
                      <span className={`badge badge-tier badge-${l.promotionTier === "featured" ? "silver" : l.promotionTier}`}>
                        {TIER_LABEL[l.promotionTier]}
                      </span>
                    )}
                  </div>
                  <div className="sub">
                    {l.categoryName} · {formatPrice(l.priceDaily || l.priceHourly, l.currency)}/
                    {l.priceDaily ? "dag" : "klst"}
                    {l.depositAmount > 0 && ` · trygging ${formatPrice(l.depositAmount, l.currency)}`}
                  </div>
                  <div className="sub">
                    {l.viewCount} skoðanir · {l.favoriteCount} vistuð
                    {l.status === "published" && l.expiresAt && ` · ${daysLabel(l.expiresAt)}`}
                    {activePromo(l) && ` · kynning til ${fmtDate(l.promotionUntil)}`}
                  </div>
                </div>
                <span className={`status-pill status-${l.status}`}>{statusLabel(l.status)}</span>
                <div className="row">
                  <Link className="btn btn-outline btn-sm" to={`/dashboard/listings/${l.id}/stats`}>Tölfræði</Link>
                  <Link className="btn btn-outline btn-sm" to={`/dashboard/calendar/${l.id}`}>Dagatal</Link>
                  <Link className="btn btn-outline btn-sm" to={`/dashboard/listings/${l.id}`}>Breyta</Link>
                  <Link className="btn btn-outline btn-sm" to="/promote">Kynna ↑</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => del(l)}>Eyða</button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : archivedRows.length === 0 ? (
        <div className="empty">
          <h3>Safnið er tómt</h3>
          <p>Útrunnar og eyttar auglýsingar birtast hér.</p>
        </div>
      ) : (
        <ul className="plain-list">
          {archivedRows.map((l) => (
            <li key={l.id}>
              {l.mainImage ? (
                <img src={l.mainImage} alt="" />
              ) : (
                <div className="img-placeholder" style={{ width: 56, height: 42 }}>I</div>
              )}
              <div className="grow">
                <div className="title">
                  <Link to={`/listing/${l.slug}`}>{l.title}</Link>
                </div>
                <div className="sub">
                  {l.categoryName} · {formatPrice(l.priceDaily || l.priceHourly, l.currency)}/
                  {l.priceDaily ? "dag" : "klst"}
                </div>
                <div className="sub">
                  {statusLabel(l.status)}
                  {l.expiresAt ? ` · ${fmtDate(l.expiresAt)}` : ""}
                </div>
              </div>
              <span className={`status-pill status-${l.status}`}>{statusLabel(l.status)}</span>
              <div className="row">
                <button className="btn btn-primary btn-sm" onClick={() => republish(l)}>Endurvekja</button>
                <button className="btn btn-danger btn-sm" onClick={() => deletePermanent(l)}>Eyða varanlega</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
