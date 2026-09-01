import React, { useState, useCallback, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../store";
import { useLang } from "../i18n";

export default function Header() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

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
          <span className="brand-mark" aria-hidden="true" />
          <span>Rento</span>
        </Link>

        <div className={`mobile-overlay ${menuOpen ? "open" : ""}`} onClick={closeMenu} />

        <nav className={`header-nav ${menuOpen ? "open" : ""}`}>
          <Link to="/search" className="nav-link" onClick={closeMenu}>
            {t("nav.rent")}
          </Link>
          <Link to="/dashboard/listings/new" className="nav-link highlight" onClick={closeMenu}>
            {t("nav.list")}
          </Link>
          {user ? (
            <div className="user-menu">
              <Link to="/dashboard" className="nav-link" onClick={closeMenu}>
                {t("nav.dashboard")}
              </Link>
              <Link to="/messages" className="nav-link" onClick={closeMenu}>
                {t("nav.messages")}
              </Link>
              <button className="nav-link" onClick={() => { logout(); closeMenu(); }}>
                {t("nav.logout")}
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={closeMenu}>
                {t("nav.login")}
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>
                {t("nav.register")}
              </Link>
            </>
          )}
          <select
            className="lang-select"
            value={lang}
            onChange={(e) => { setLang(e.target.value); closeMenu(); }}
            aria-label="Language"
          >
            <option value="en">EN</option>
            <option value="is">IS</option>
          </select>
        </nav>
      </div>
    </header>
  );
}
