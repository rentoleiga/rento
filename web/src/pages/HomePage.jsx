import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    api.get(`/api/categories?lang=${lang}`).then((d) => setCategories(d.categories || [])).catch(() => {});
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
          <p>{t("hero.sub")}</p>
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

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("home.categories")}</h2>
            <Link to="/search">{t("home.browseAll")}</Link>
          </div>
          <div className="category-grid">
            {categories.map((c) => (
              <Link key={c.id} to={`/search?category=${c.slug}`} className="category-tile">
                <div className="tile-icon">
                  <CategoryIcon slug={c.slug} />
                </div>
                <div>{c.name}</div>
              </Link>
            ))}
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