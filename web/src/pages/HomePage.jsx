import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import ListingCard from "../components/ListingCard";
import CategoryIcon from "../components/CategoryIcon";
import { useLang } from "../i18n";

export default function HomePage() {
  const { t, lang } = useLang();
  const [categories, setCategories] = useState([]);
  const [platinum, setPlatinum] = useState([]);
  const [popular, setPopular] = useState([]);
  const [newest, setNewest] = useState([]);
  const [q, setQ] = useState({ keyword: "", city: "", start: "", end: "" });
  const navigate = useNavigate();
  const catRef = useRef(null);
  const scrollCats = (dir) => {
    const el = catRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  useEffect(() => {
    api.get(`/api/categories/all?lang=${lang}`).then((d) => setCategories(d.categories?.filter(c=>!c.parent_id) || [])).catch(() => {});
  }, [lang]);

  useEffect(() => {
    api.get("/api/home")
      .then((d) => {
        setPlatinum(d.platinum || []);
        setPopular(d.popular || []);
        setNewest(d.newest || []);
      })
      .catch(() => {});
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.keyword) params.set("keyword", q.keyword);
    if (q.city) params.set("location", q.city);
    if (q.start) params.set("start", new Date(q.start).toISOString());
    if (q.end) params.set("end", new Date(q.end).toISOString());
    navigate(`/search?${params.toString()}`);
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>{t("hero.title")}</h1>
          {t("hero.sub") && <p>{t("hero.sub")}</p>}
          <form className="hero-search" onSubmit={submitSearch}>
            <div className="field">
              <label>{t("hero.what")}</label>
              <input
                value={q.keyword}
                onChange={(e) => setQ({ ...q, keyword: e.target.value })}
                placeholder="e.g. campervan, fishing gear"
              />
            </div>
            <div className="field">
              <label>{t("hero.where")}</label>
              <input
                value={q.city}
                onChange={(e) => setQ({ ...q, city: e.target.value })}
                placeholder="e.g. Reykjavík"
              />
            </div>
            <div className="field">
              <label>{t("hero.from")}</label>
              <input
                type="date"
                lang="is"
                value={q.start}
                onChange={(e) => setQ({ ...q, start: e.target.value })}
              />
            </div>
            <div className="field">
              <label>{t("hero.to")}</label>
              <input
                type="date"
                lang="is"
                value={q.end}
                onChange={(e) => setQ({ ...q, end: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              {t("search.go")}
            </button>
          </form>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="promo-banner">
            <div className="promo-banner-text">
              <h2>{t("home.promoTitle")}<br /><span className="promo-accent">{t("home.promoTitle2")}</span></h2>
              <p>{t("home.promoSub")}</p>
              <div className="promo-actions">
                <Link to="/search" className="btn btn-primary">{t("home.promoFind")}</Link>
                <Link to="/dashboard/listings/new" className="btn btn-outline" style={{ background: "#fff" }}>{t("home.promoStart")}</Link>
              </div>
            </div>
            <div className="promo-banner-icons">
              <span className="promo-icon" style={{ background: "#e0f0f0" }}>🔑</span>
              <span className="promo-icon" style={{ background: "#fde8d8", marginTop: 20 }}>⚠️</span>
              <span className="promo-icon" style={{ background: "#fef3d5" }}>📷</span>
              <span className="promo-icon" style={{ background: "#f0e6f6" }}>🚲</span>
              <span className="promo-icon" style={{ background: "#e6f6fd" }}>🔊</span>
            </div>
            <button className="promo-close" aria-label="Close" onClick={(e)=> e.currentTarget.closest('.promo-banner').style.display='none'}>×</button>
          </div>
          <p className="promo-foot">{t("home.promoFoot")}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("home.categories")}</h2>
            <Link to="/search">{t("home.browseAll")}</Link>
          </div>
          <div className="category-slider-wrap">
            <button className="cat-arrow cat-arrow-left" onClick={() => scrollCats(-1)} aria-label="Prev">‹</button>
            <div className="category-grid" ref={catRef}>
              {categories.map((c) => (
                <Link key={c.id} to={`/search?category=${c.slug}`} className="category-tile">
                  <div className="tile-icon">
                    <CategoryIcon slug={c.slug} />
                  </div>
                  <div>{c.name}</div>
                  {c.listing_count != null && <div className="muted small">{c.listing_count}</div>}
                </Link>
              ))}
            </div>
            <button className="cat-arrow cat-arrow-right" onClick={() => scrollCats(1)} aria-label="Next">›</button>
          </div>
        </div>
      </section>

      {platinum.length > 0 && (
        <section className="section section-flush featured-band">
          <div className="container">
            <div className="section-head">
              <h2>{t("home.featured")}</h2>
              <span className="promo-chip">✦ {t("home.promoted")}</span>
            </div>
            <div className="grid">
              {platinum.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section className="section section-flush">
          <div className="container">
            <div className="section-head">
              <h2>{t("home.popular")}</h2>
              <Link to="/search?sort=views">{t("home.seeAll")}</Link>
            </div>
            <div className="grid">
              {popular.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        </section>
      )}

      {newest.length > 0 && (
        <section className="section section-flush">
          <div className="container">
            <div className="section-head">
              <h2>{t("home.newest")}</h2>
              <Link to="/search?sort=newest">{t("home.seeAll")}</Link>
            </div>
            <div className="grid">
              {newest.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}