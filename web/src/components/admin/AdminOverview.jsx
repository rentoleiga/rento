import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { fmt, fmtIsk } from "./shared";

export default function AdminOverview() {
  const [o, setO] = useState(null);
  const [vis, setVis] = useState(null);
  const [rev, setRev] = useState(null);
  const [error, setError] = useState("");

  const loadVisitors = () =>
    api.get("/api/admin/visitors").then(setVis).catch(() => {});

  useEffect(() => {
    api.get("/api/admin/overview").then(setO).catch((e) => setError(e.message));
    loadVisitors();
    api.get("/api/admin/revenue").then(setRev).catch(() => {});
    const t = setInterval(loadVisitors, 60000);
    return () => clearInterval(t);
  }, []);

  if (error) return <div className="form-error">{error}</div>;
  if (!o) return <div className="empty">Loading…</div>;

  const bookingsActive = (o.bookings.byStatus.active || 0) + (o.bookings.byStatus.approved || 0);
  const maxReg = Math.max(1, ...o.registrations.map((r) => r.n));
  const maxVis = Math.max(1, ...(vis?.series || []).map((r) => r.visitors));

  return (
    <>
      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ fontSize: 17, marginTop: 0 }}>Visitors</h2>
          <span className="muted" style={{ fontSize: 12 }}>
            {vis ? "auto-refresh every 60s" : "loading…"}
          </span>
        </div>
        <div className="dash-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          <div className="stat-card">
            <div className="stat-num">{vis ? fmt(vis.online) : "—"}</div>
            <div className="stat-label">Online now</div>
            <div className="muted" style={{ fontSize: 12 }}>last 5 minutes</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{vis ? fmt(vis.today) : "—"}</div>
            <div className="stat-label">Today</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {vis ? `${fmt(vis.views_today)} page views` : ""}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{vis ? fmt(vis.week) : "—"}</div>
            <div className="stat-label">Last 7 days</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {vis ? `${fmt(vis.views_week)} page views` : ""}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{vis ? fmt(vis.month) : "—"}</div>
            <div className="stat-label">Last 30 days</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {vis ? `${fmt(vis.views_month)} page views` : ""}
            </div>
          </div>
        </div>
        {vis && vis.series.length > 0 && (
          <div className="admin-bars" style={{ marginTop: 14 }}>
            {vis.series.map((r) => (
              <div key={r.day} className="admin-bar" title={`${r.day}: ${r.visitors} visitors / ${r.views} views`}>
                <div className="admin-bar-fill" style={{ height: `${Math.max(6, (r.visitors / maxVis) * 100)}%` }} />
                <span>{r.visitors}</span>
              </div>
            ))}
          </div>
        )}
      </div>

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
        <h2 style={{ fontSize: 17, marginTop: 0 }}>Revenue (ad slots &amp; promotions)</h2>
        {!rev ? <div className="muted">Loading…</div> : (
          <div className="dash-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
            <div className="stat-card">
              <div className="stat-num">{fmtIsk(rev.sums.total)}</div>
              <div className="stat-label">Total paid</div>
              <div className="muted" style={{ fontSize: 12 }}>{rev.sums.sales} sales · {rev.sums.refunds} refunds</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{fmtIsk(rev.sums.slot_total)}</div>
              <div className="stat-label">Ad slots</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{fmtIsk(rev.sums.promotion_total)}</div>
              <div className="stat-label">Promotions</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">
                {rev.sums.sales ? fmtIsk(rev.sums.total / rev.sums.sales) : "0 kr."}
              </div>
              <div className="stat-label">Avg per sale</div>
            </div>
          </div>
        )}
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
