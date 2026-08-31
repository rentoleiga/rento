import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatPrice } from "../api";
import { useAuth } from "../store";
import { useLang } from "../i18n";
import ListingCard from "../components/ListingCard";

function RequireAuth({ children }) {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) refresh().then(() => {});
  }, [user, refresh]);
  useEffect(() => {
    if (!user) navigate("/login?next=/dashboard");
  }, [user, navigate]);
  if (!user) return null;
  return children;
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { t } = useLang();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    api.get("/api/dashboard/overview").then(setStats).catch(() => {});
    api.get("/api/dashboard/renter/bookings?status=active").then((d) => setBookings(d.bookings || [])).catch(() => {});
    api.get("/api/dashboard/owner/listings").then((d) => setListings(d.listings || [])).catch(() => {});
  }, []);

  return (
    <div className="container section">
      <h1 className="mt0">
        {t("dash.greeting").replace("{name}", user?.firstName || "")}
      </h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {stats?.unreadNotifications > 0 && `${t("dash.notifs").replace("{n}", stats.unreadNotifications)} · `}
        {stats?.unreadMessages > 0 && t("dash.unread").replace("{n}", stats.unreadMessages)}
      </p>

      <nav className="dash-nav">
        <Link to="/dashboard/listings">{t("dash.nav.listings")}</Link>
        <Link to="/dashboard/listings/new">{t("dash.nav.add")}</Link>
        <Link to="/dashboard/bookings">{t("dash.nav.bookings")}</Link>
        <Link to="/favorites">{t("dash.nav.favorites")}</Link>
        <Link to="/messages">{t("dash.nav.messages")}</Link>
      </nav>

      {stats && (
        <div className="dash-grid">
          <div className="stat-card">
            <div className="stat-num">{stats.owner.listingsActive}<span className="muted" style={{ fontSize: 14 }}> / {stats.owner.listingsTotal}</span></div>
            <div className="stat-label">{t("dash.stats.activeListings")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.owner.bookingRequests}</div>
            <div className="stat-label">{t("dash.stats.pendingRequests")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{formatPrice(stats.owner.revenue, "ISK").replace(" ISK", "")}</div>
            <div className="stat-label">{t("dash.stats.revenue")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.renter.upcoming}</div>
            <div className="stat-label">{t("dash.stats.upcoming")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.renter.completed}</div>
            <div className="stat-label">{t("dash.stats.completed")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.favorites.length}</div>
            <div className="stat-label">{t("dash.stats.favorites")}</div>
          </div>
        </div>
      )}

      {bookings.length > 0 && (
        <>
          <h2 style={{ fontSize: 19 }}>{t("dash.activeRentals")}</h2>
          <ul className="plain-list">
            {bookings.map((b) => (
              <li key={b.id}>
                {b.listing.image && <img src={b.listing.image} alt="" />}
                <div className="grow">
                  <div className="title"><Link to={`/listing/${b.listing.slug}`}>{b.listing.title}</Link></div>
                  <div className="sub">
                    {b.start.slice(0, 10)} → {b.end.slice(0, 10)} · {formatPrice(b.total, b.currency)}
                  </div>
                </div>
                <span className={`status-pill status-${b.status}`}>{t(`status.${b.status}`)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <section style={{ marginTop: 30 }}>
        <div className="section-head">
          <h2 style={{ fontSize: 19 }}>{t("dash.nav.listings")}</h2>
          <Link className="btn btn-outline btn-sm" to="/dashboard/listings">{t("dash.viewAll")}</Link>
        </div>
        {listings.length === 0 ? (
          <div className="empty">
            <h3>No listings yet</h3>
            <p>List your items and start earning.</p>
            <Link className="btn btn-primary" to="/dashboard/listings/new">{t("dash.nav.add")}</Link>
          </div>
        ) : (
          <div className="grid">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}