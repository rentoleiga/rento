import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../store";
import { api } from "../api";
import AdminOverview from "../components/admin/AdminOverview";
import AdminUsers from "../components/admin/AdminUsers";
import AdminListings from "../components/admin/AdminListings";
import AdminBookings from "../components/admin/AdminBookings";
import AdminPayments from "../components/admin/AdminPayments";
import AdminMessages from "../components/admin/AdminMessages";
import AdminLog from "../components/admin/AdminLog";

const TABS = [
  { k: "overview", label: "Yfirlit", C: AdminOverview },
  { k: "users", label: "Notendur", C: AdminUsers },
  { k: "listings", label: "Auglýsingar", C: AdminListings },
  { k: "bookings", label: "Bókanir", C: AdminBookings },
  { k: "payments", label: "Uppgjör", C: AdminPayments },
  { k: "messages", label: "Meldingar", C: AdminMessages },
  { k: "log", label: "Atvikaskrá", C: AdminLog },
];

function Denied({ user }) {
  if (!user) {
    return (
      <div className="container section">
        <div className="empty">
          <h3>Innskráning nauðsynleg</h3>
          <p>Þú þarft að vera skráð(ur) inn sem stjórnandi til að sjá þessa síðu.</p>
          <Link className="btn btn-primary" to="/login">Innskrá</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="container section">
      <div className="empty">
        <h3>403 — Aðgangur hafnaður</h3>
        <p>Þessi síða er aðeins fyrir stjórnendur.</p>
        <Link className="btn btn-outline" to="/dashboard">Fara á mælaborð</Link>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [unread, setUnread] = useState(0);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    api.get("/api/admin/messages?perPage=1").then((d) => setUnread(d.unread || 0)).catch(() => {});
  }, [isAdmin, tab]);

  if (!user || !isAdmin) return <Denied user={user} />;

  const Active = TABS.find((x) => x.k === tab)?.C || AdminOverview;

  return (
    <div className="container section" style={{ maxWidth: 1180 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <h1 className="mt0">Stjórnborð</h1>
        <span className="muted">innskráð(ur) sem {user.email}</span>
      </div>

      <div className="dash-nav">
        {TABS.map((x) => (
          <button key={x.k} className={tab === x.k ? "active" : ""} onClick={() => setTab(x.k)}>
            {x.label}
            {x.k === "messages" && unread > 0 && <span className="tab-badge">{unread}</span>}
          </button>
        ))}
      </div>

      <Active />
    </div>
  );
}
