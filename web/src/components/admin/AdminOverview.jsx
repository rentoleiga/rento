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
  if (!o) return <div className="empty">Hleður…</div>;

  const bookingsActive = (o.bookings.byStatus.active || 0) + (o.bookings.byStatus.approved || 0);
  const maxReg = Math.max(1, ...o.registrations.map((r) => r.n));

  return (
    <>
      <div className="dash-grid">
        <div className="stat-card">
          <div className="stat-num">{fmt(o.users.total)}</div>
          <div className="stat-label">Notendur</div>
          <div className="muted" style={{ fontSize: 12 }}>
            +{o.users.new1} í dag · +{o.users.new7} í viku · +{o.users.new30} í mánuði
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.users.admins)}</div>
          <div className="stat-label">Stjórnendur</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.listings.published)}</div>
          <div className="stat-label">Virkar auglýsingar</div>
          <div className="muted" style={{ fontSize: 12 }}>{fmt(o.listings.boosted)} með boost</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.bookings.total)}</div>
          <div className="stat-label">Bókanir</div>
          <div className="muted" style={{ fontSize: 12 }}>{fmt(bookingsActive)} virkar</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmtIsk(o.bookings.revenue)}</div>
          <div className="stat-label">Tekjur af bókunum</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmtIsk(o.payments.paidAmount)}</div>
          <div className="stat-label">Greiðslur (borgaðar)</div>
          <div className="muted" style={{ fontSize: 12 }}>þóknun {fmtIsk(o.payments.fees)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.credits.issued)}</div>
          <div className="stat-label">Kredit útgefið</div>
          <div className="muted" style={{ fontSize: 12 }}>{fmt(o.credits.spent)} varið</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.credits.outstanding)}</div>
          <div className="stat-label">Kredit í umferð</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {fmt(o.credits.extraSlots)} pláss · {fmt(o.credits.entries)} færslur
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.messages)}</div>
          <div className="stat-label">Skilaboð</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(o.reviews)}</div>
          <div className="stat-label">Umsagnir</div>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, marginTop: 0 }}>Skráningar síðustu 30 dagar</h2>
        {o.registrations.length === 0 ? (
          <p className="muted">Engar skráningar á þessu tímabili.</p>
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
        <h2 style={{ fontSize: 17, marginTop: 0 }}>Staða kerfisins</h2>
        <div className="admin-chips">
          <span className="chip">
            Auglýsingar: {Object.entries(o.listings.byStatus).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}
          </span>
          <span className="chip">
            Bókanir: {Object.entries(o.bookings.byStatus).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}
          </span>
          <span className="chip">
            Greiðslur: {Object.entries(o.payments.byStatus).map(([k, v]) => `${k} ${v}`).join(" · ") || "—"}
          </span>
        </div>
      </div>
    </>
  );
}
