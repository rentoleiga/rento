import React, { useState, useCallback, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store";
import { useLang } from "../i18n";
import { api, formatPrice, timeAgo } from "../api";

export default function Header() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sq, setSq] = useState("");
  const [sloc, setSloc] = useState("");
  const [revenue, setRevenue] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [badgeTick, setBadgeTick] = useState(0);
  const notifRef = useRef(null);

  const closeMenu = useCallback(() => { setMenuOpen(false); setNotifOpen(false); }, []);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  useEffect(() => {
    if (!user) {
      setRevenue(null);
      setUnreadMessages(0);
      setUnreadNotifications(0);
      return;
    }
    let alive = true;
    const load = () => {
      api.get("/api/dashboard/overview")
        .then((d) => {
          if (!alive) return;
          setRevenue(d?.owner?.revenue ?? null);
          setUnreadMessages(d?.unreadMessages || 0);
          setUnreadNotifications(d?.unreadNotifications || 0);
        })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 30000);
    return () => { alive = false; clearInterval(timer); };
  }, [user, location.pathname, badgeTick]);

  useEffect(() => {
    const refresh = () => setBadgeTick((n) => n + 1);
    window.addEventListener("rento:badges", refresh);
    return () => window.removeEventListener("rento:badges", refresh);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    if (!notifOpen) return;
    const onDoc = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [notifOpen]);

  const loadNotifs = () => {
    setNotifLoading(true);
    api.get("/api/notifications")
      .then((d) => setNotifs(d.notifications || []))
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  };

  const toggleNotifs = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    setMenuOpen(false);
    if (next) loadNotifs();
  };

  const notifData = (n) => {
    try {
      return typeof n.data === "string" ? JSON.parse(n.data) : (n.data || {});
    } catch {
      return {};
    }
  };

  const openNotif = async (n) => {
    if (!n.read_at) {
      try {
        await api.put(`/api/notifications/${n.id}/read`);
        setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
        setUnreadNotifications((c) => Math.max(0, c - 1));
      } catch {}
    }
    const data = notifData(n);
    setNotifOpen(false);
    if (data.conversationId) {
      navigate(`/messages/${data.conversationId}`);
    } else if (data.bookingId || n.type?.startsWith("booking") || n.type === "payment_success") {
      navigate("/dashboard/bookings");
    } else if (n.type === "new_review") {
      navigate(`/users/${user.id}`);
    } else if (n.type === "saved_search_match" || n.type === "search_alert") {
      navigate("/dashboard/searches");
    }
  };

  const markAllNotifs = async () => {
    try {
      await api.put("/api/notifications/read-all");
      const now = new Date().toISOString();
      setNotifs((prev) => prev.map((x) => ({ ...x, read_at: x.read_at || now })));
      setUnreadNotifications(0);
    } catch {}
  };

  const submitHeaderSearch = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (sq.trim()) p.set("keyword", sq.trim());
    if (sloc.trim()) p.set("location", sloc.trim());
    closeMenu();
    navigate(`/search?${p.toString()}`);
  };

  const initial = ((user?.firstName || user?.email || "R")[0] || "R").toUpperCase();
  const badgeCount = Math.max(unreadNotifications, unreadMessages);

  const mainLinks = [
    { to: "/dashboard/listings", label: t("dash.nav.listings"), icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>) },
    { to: "/messages", label: t("nav.messages"), badge: unreadMessages, icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>) },
    { to: "/dashboard/bookings", label: t("dash.nav.bookings"), icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>) },
  { to: "/dashboard/payments", label: "Kvittanir", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>) },
    { to: "/favorites", label: t("dash.nav.favorites"), icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>) },
    ...(user?.role === "admin"
      ? [{
          to: "/admin",
          label: "Stjórnborð",
          icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
        }]
      : []),
  ];
  const profileTo = user?.id ? `/users/${user.id}` : "/dashboard";

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          <img src="/rento-logo.png" alt="Rentó" className="brand-img" />
        </Link>

        <form className="header-search" onSubmit={submitHeaderSearch} role="search">
          <div className="hs-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/></svg>
            <input value={sq} onChange={(e) => setSq(e.target.value)} placeholder={t("search.placeholder")} aria-label={t("search.placeholder")} />
          </div>
          <span className="hs-div" aria-hidden="true" />
          <div className="hs-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <input value={sloc} onChange={(e) => setSloc(e.target.value)} placeholder={t("hero.where")} aria-label={t("hero.where")} />
          </div>
          <button type="submit" className="hs-go" aria-label={t("search.go")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/></svg>
          </button>
        </form>

        <div className={`mobile-overlay ${menuOpen ? "open" : ""}`} onClick={closeMenu} />

        <div className="header-actions">
          {user ? (
            <div className="user-wrap">
              <Link to="/dashboard/listings/new" className="icon-btn" title={t("nav.list")} onClick={closeMenu}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
              </Link>
              <Link to="/favorites" className="icon-btn" title={t("dash.nav.favorites")} onClick={closeMenu}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </Link>
              <div className="notif-wrap" ref={notifRef}>
                <button className={`icon-btn ${notifOpen ? "active" : ""}`} title="Tilkynningar" onClick={toggleNotifs} aria-label="Tilkynningar" aria-expanded={notifOpen}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
                  {badgeCount > 0 && <span className="unread-badge">{badgeCount > 9 ? "9+" : badgeCount}</span>}
                </button>
                {notifOpen && (
                  <div className="notif-panel">
                    <div className="notif-head">
                      <strong>Tilkynningar</strong>
                      {unreadNotifications > 0 && <button className="linklike" onClick={markAllNotifs}>Merkja allt lesið</button>}
                    </div>
                    <div className="notif-list">
                      {notifLoading ? (
                        <div className="notif-empty">Hleður…</div>
                      ) : notifs.length === 0 ? (
                        <div className="notif-empty">Engar tilkynningar</div>
                      ) : (
                        notifs.map((n) => (
                          <button key={n.id} className={`notif-item ${n.read_at ? "" : "unread"}`} onClick={() => openNotif(n)}>
                            <span className="notif-item-title">{n.title}</span>
                            {n.body && <span className="notif-item-body">{n.body}</span>}
                            <span className="notif-item-time">{timeAgo(n.created_at)}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button className={`avatar-btn ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Account" aria-expanded={menuOpen}>
                <span className="avatar-face">{initial}</span>
                {badgeCount > 0 && <span className="unread-badge avatar-badge">{badgeCount > 9 ? "9+" : badgeCount}</span>}
              </button>
            </div>
          ) : (
            <div className="guest-actions">
              <Link to="/login" className="guest-link" onClick={closeMenu}>{t("nav.login")}</Link>
              <Link to="/register" className="guest-link guest-link-muted" onClick={closeMenu}>{t("nav.register")}</Link>
              <Link to="/register?next=/dashboard/listings/new" className="btn btn-primary guest-cta" onClick={closeMenu}>Leigja út</Link>
            </div>
          )}
        </div>

        <nav className={`drawer ${menuOpen ? "open" : ""}`}>
          <button className="drawer-close" onClick={closeMenu} aria-label="Close">×</button>
          {user ? (
            <div className="mobile-account">
              <div className="ma-head">
                <div className="user-menu-name">{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}</div>
                <div className="user-menu-email">{user.email}</div>
                <div className="user-menu-balance">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
                  <span>{revenue != null ? formatPrice(revenue, "ISK") : "…"}</span>
                </div>
              </div>
              <Link to="/" onClick={closeMenu}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>Heim</Link>
              {mainLinks.map((l) => (
                <Link key={l.to} to={l.to} onClick={closeMenu}>{l.icon}{l.label}
                  {l.badge > 0 && <span className="drawer-badge">{l.badge > 9 ? "9+" : l.badge}</span>}
                </Link>
              ))}
              <Link to={profileTo} onClick={closeMenu}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>{t("nav.profile")}</Link>
              <button onClick={() => { logout(); closeMenu(); navigate("/"); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>{t("nav.logout")}</button>
            </div>
          ) : (
            <div className="mobile-account">
              <Link to="/" onClick={closeMenu}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>Heim</Link>
              <Link to="/login" onClick={closeMenu}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>{t("nav.login")}</Link>
              <Link to="/register" onClick={closeMenu}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>{t("nav.register")}</Link>
              <Link to="/register?next=/dashboard/listings/new" onClick={closeMenu}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>Leigja út</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
