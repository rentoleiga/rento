import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, formatPrice } from "../api";
import { fmtDate } from "../lib/dates";

const DAY = 86400000;
const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY));
const daysShort = (iso) => {
  const d = daysLeft(iso);
  if (d <= 0) return "í dag";
  return `eftir ${d} ${d === 1 ? "dag" : "daga"}`;
};
const boostPeriod = (s) => {
  if (!s.promotionUntil || new Date(s.promotionUntil).getTime() <= Date.now()) return "";
  const from = s.promotionStartedAt ? `frá ${fmtDate(s.promotionStartedAt)} ` : "";
  return `Boost: ${from}til ${fmtDate(s.promotionUntil)} (${daysShort(s.promotionUntil)})`;
};

export default function ListingStatsPage() {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/api/dashboard/owner/listings/${id}/stats`)
      .then((d) => setStats(d.stats))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="container section"><div className="empty"><h3>{error}</h3></div></div>;
  if (!stats) return <div className="container section"><div className="empty">Hleður…</div></div>;

  const b = stats.bookings || {};
  const boost = stats.promotionTier && stats.promotionTier !== "none" ? boostPeriod(stats) : "";
  const rows = [
    ["Skoðanir", stats.views],
    ["Einstakar skoðanir", stats.uniqueViews],
    ["Vistuð", stats.favorites],
    ["Samtöl", stats.conversations],
    ["Skilaboð", stats.messages],
    ["Bókanir alls", stats.bookingsTotal],
    ["Í bið", b.pending || 0],
    ["Virkar", b.active || 0],
    ["Lokið", b.completed || 0],
    ["Hafnað", b.rejected || 0],
    ["Afpantað", b.cancelled || 0],
  ];

  return (
    <div className="container section" style={{ maxWidth: 760 }}>
      <p style={{ marginBottom: 4 }}><Link to="/dashboard/listings">← Auglýsingar</Link></p>
      <h1 className="mt0">{stats.title}</h1>
      <p className="muted" style={{ marginTop: -4 }}>
        {stats.status} · birt {fmtDate(stats.createdAt) || "—"}
        {stats.expiresAt ? ` · rennur út ${fmtDate(stats.expiresAt)}` : ""}
        {boost ? ` · ${boost}` : ""}
      </p>

      <div className="dash-grid" style={{ marginTop: 18 }}>
        {rows.map(([label, val]) => (
          <div className="stat-card" key={label}>
            <div className="stat-num">{val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="detail-section" style={{ marginTop: 20 }}>
        <h3>Einkunn</h3>
        <p className="mb0">
          {Number(stats.rating || 0).toFixed(1)} / 5 úr {stats.reviews} umsögnum
        </p>
      </div>

      <p className="muted" style={{ fontSize: 13 }}>
        Skoðanir teljast þegar auglýsing er opnuð. Vistuð og samtal eru talin frá upphafi.
      </p>
    </div>
  );
}
