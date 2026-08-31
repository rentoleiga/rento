import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../store";
import { useLang } from "../i18n";

export default function Header() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");

  const submitSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("keyword", q);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Rento</span>
        </Link>

        <form className="header-search" onSubmit={submitSearch}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search.placeholder")}
            aria-label={t("search.placeholder")}
          />
          <button className="btn btn-primary" type="submit">
            {t("search.go")}
          </button>
        </form>

        <nav className="header-nav">
          <Link to="/search" className="nav-link">
            {t("nav.rent")}
          </Link>
          <Link to="/dashboard/listings/new" className="nav-link highlight">
            {t("nav.list")}
          </Link>
          {user ? (
            <div className="user-menu">
              <Link to="/dashboard" className="nav-link">
                {t("nav.dashboard")}
              </Link>
              <Link to="/messages" className="nav-link">
                {t("nav.messages")}
              </Link>
              <button className="nav-link" onClick={() => logout()}>
                {t("nav.logout")}
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                {t("nav.login")}
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                {t("nav.register")}
              </Link>
            </>
          )}
          <select
            className="lang-select"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
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