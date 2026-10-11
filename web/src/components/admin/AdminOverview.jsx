import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { fmt, fmtIsk } from "./shared";

export default function AdminOverview() {
  const [o, setO] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/admin/overview").then(setO).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="form-error">{error}</div>;
  if (!o) return <div className="empty">Loading…</div>;

  const bookingsActive = (o.bookings.byStatus.active || 0) + (o.bookings.byStatus.approved || 0);
  const maxReg = Math.max(1, ...o.registrations.map((r) => r.n));

  return (
    <>
      <div className="dash-grid">
        <div className="stat-card">
          <div className="stat-num">{fmt(o.users.total)}</div>
          <div className="stat-label">Users</div>
          <div className="muted" style={{ fontSize: 12 }}>
            +{o.users.new1} today · +{o.users.new7} this week · +{o.users.new30} this month
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.users.admins)}</div>
          <div className="stat-label">Administrators</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.listings.published)}</div>
          <div className="stat-label">Active listings</div>
          <div className="muted" style={{ fontSize: 12 }}>{fmt(o.listings.boosted)} boosted</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.bookings.total)}</div>
          <div className="stat-label">Bookings</div>
          <div className="muted" style={{ fontSize: 12 }}>{fmt(bookingsActive)} active</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmtIsk(o.bookings.revenue)}</div>
          <div className="stat-label">Booking revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmtIsk(o.payments.paidAmount)}</div>
          <div className="stat-label">Payments (paid)</div>
          <div className="muted" style={{ fontSize: 12 }}>fees {fmtIsk(o.payments.fees)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.credits.issued)}</div>
          <div className="stat-label">Credits issued</div>
          <div className="muted" style={{ fontSize: 12 }}>{fmt(o.credits.spent)} spent</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.credits.outstanding)}</div>
          <div className="stat-label">Credits outstanding</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {fmt(o.credits.extraSlots)} slots · {fmt(o.credits.entries)} entries
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.messages)}</div>
          <div className="stat-label">Messages</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.reviews)}</div>
          <div className="stat-label">Reviews</div>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, marginTop: 0 }}>Signups, last 30 days</h2>
        {o.registrations.length === 0 ? (
          <p className="muted">No signups in this period.</p>
        ) : (
          <div className="admin-bars">
            {o.registrations.map((r) => (
              <div key={r.day} className="admin-bar" title={`${r.day}: ${r.n}`}>
                <div className="admin-bar-fill" style={{ height: `${Math.max(6, (r.n / maxReg) * 100)}%` }} />
                <span>{r.n}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 17, marginTop: 0 }}>System status</h2>
        <div className="admin-chips">
          <span className="chip">
            Listings: {Object.entries(o.listings.byStatus).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}
          </span>
          <span className="chip">
            Bookings: {Object.entries(o.bookings.byStatus).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}
          </span>
          <span className="chip">
            Payments: {Object.entries(o.payments.byStatus).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}
          </span>
        </div>
      </div>
    </>
  );
}
