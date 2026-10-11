import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../store";
import { api } from "../api";
import AdminOverview from "../components/admin/AdminOverview";
import AdminUsers from "../components/admin/AdminUsers";
import AdminListings from "../components/admin/AdminListings";
import AdminBookings from "../components/admin/AdminBookings";
import AdminPayments from "../components/admin/AdminPayments";
import AdminAlerts from "../components/admin/AdminAlerts";
import AdminMessages from "../components/admin/AdminMessages";
import AdminLog from "../components/admin/AdminLog";

const TABS = [
  { k: "overview", label: "Overview", C: AdminOverview },
  { k: "users", label: "Users", C: AdminUsers },
  { k: "listings", label: "Listings", C: AdminListings },
  { k: "bookings", label: "Bookings", C: AdminBookings },
  { k: "payments", label: "Payments", C: AdminPayments },
  { k: "alerts", label: "Suspicious", C: AdminAlerts },
  { k: "messages", label: "Messages", C: AdminMessages },
  { k: "log", label: "Audit log", C: AdminLog },
];

function Denied({ user }) {
  if (!user) {
    return (
      <div className="container section">
        <div className="empty">
          <h3>Sign in required</h3>
          <p>You need to be signed in as an administrator to view this page.</p>
          <Link className="btn btn-primary" to="/login">Sign in</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="container section">
      <div className="empty">
        <h3>403 — Access denied</h3>
        <p>This page is for administrators only.</p>
        <Link className="btn btn-outline" to="/dashboard">Go to dashboard</Link>
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
        <h1 className="mt0">Admin panel</h1>
        <span className="muted">signed in as {user.email}</span>
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
