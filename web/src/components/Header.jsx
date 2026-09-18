import React, { useState, useCallback, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store";
import { useLang } from "../i18n";
import { api, formatPrice } from "../api";

export default function Header() {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [sq, setSq] = useState("");
  const [sloc, setSloc] = useState("");
  const [revenue, setRevenue] = useState(null);
  const userWrap = useRef(null);

  const closeMenu = useCallback(() => { setMenuOpen(false); setUserOpen(false); }, []);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  useEffect(() => {
    if (user) {
      api.get("/api/dashboard/overview").then((d) => setRevenue(d?.owner?.revenue ?? null)).catch(() => {});
    } else {
      setRevenue(null);
    }
  }, [user]);

  useEffect(() => {
    const onDoc = (e) => {
      if (userWrap.current && !userWrap.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, closeMenu]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const submitHeaderSearch = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (sq.trim()) p.set("keyword", sq.trim());
    if (sloc.trim()) p.set("location", sloc.trim());
    closeMenu();
    navigate(`/search?${p.toString()}`);
  };

  const initial = ((user?.firstName || user?.email || "R")[0] || "R").toUpperCase();

  return (
    <header className="header">
      <div className="container header-inner">
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
          )}
        </button>

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

        <nav className={`header-nav ${menuOpen ? "open" : ""}`}>
          {user ? (
            <div className="user-wrap" ref={userWrap}>
              <Link to="/dashboard/listings/new" className="icon-btn" title={t("nav.list")} onClick={closeMenu}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
              </Link>
              <Link to="/favorites" className="icon-btn" title={t("dash.nav.favorites")} onClick={closeMenu}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </Link>
              <Link to="/messages" className="icon-btn" title={t("nav.messages")} onClick={closeMenu}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
              </Link>
              <button className={`avatar-btn ${userOpen ? "open" : ""}`} onClick={() => setUserOpen(!userOpen)} aria-label="Account" aria-expanded={userOpen}>
                <span className="avatar-face">{initial}</span>
              </button>
              {userOpen && (
                <div className="user-menu">
                  <div className="user-menu-head">
                    <div className="user-menu-name">{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}</div>
                    <div className="user-menu-email">{user.email}</div>
                    <div className="user-menu-balance">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
                      <span>{revenue != null ? formatPrice(revenue, "ISK") : "…"}</span>
                    </div>
                  </div>
                  <Link to="/dashboard/listings" onClick={closeMenu}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>{t("dash.nav.listings")}</Link>
                  <Link to="/messages" onClick={closeMenu}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>{t("nav.messages")}</Link>
                  <Link to="/dashboard/bookings" onClick={closeMenu}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>{t("dash.nav.bookings")}</Link>
                  <Link to="/favorites" onClick={closeMenu}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>{t("dash.nav.favorites")}</Link>
                  <div className="um-sep" />
                  <Link to={user?.id ? `/users/${user.id}` : "/dashboard"} onClick={closeMenu}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>{t("nav.profile")}</Link>
                  <div className="um-sep" />
                  <button onClick={() => { logout(); closeMenu(); navigate("/"); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>{t("nav.logout")}</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="nav-link" onClick={closeMenu}>
              {t("nav.login")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
