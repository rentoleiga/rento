import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import ListingCard from "../components/ListingCard";
import CategoryIcon from "../components/CategoryIcon";
import { useLang } from "../i18n";

const SORTS = [
  ["recommended", "search.sort.recommended"],
  ["price_asc", "search.sort.price_asc"],
  ["price_desc", "search.sort.price_desc"],
  ["rating", "search.sort.rating"],
  ["newest", "search.sort.newest"],
  ["views", "search.sort.views"],
];

export default function SearchPage() {
  const { t, lang } = useLang();
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const p = {
      keyword: params.get("keyword") || "",
      category: params.get("category") || "",
      subcategory: params.get("subcategory") || "",
      location: params.get("location") || "",
      start: params.get("start") || "",
      end: params.get("end") || "",
      min_price: params.get("min_price") || "",
      max_price: params.get("max_price") || "",
      radius: params.get("radius") || "",
      rating: params.get("rating") || "",
      verified: params.get("verified") === "1",
      delivery: params.get("delivery") === "1",
      instant: params.get("instant") === "1",
      sort: params.get("sort") || "recommended",
    };
    return p;
  }, [params]);

  useEffect(() => {
    api.get(`/api/categories/all?lang=${lang}`).then((d) => setCategories(d.categories || [])).catch(() => {});
    api.get("/api/locations").then((d) => setLocations(d.locations || [])).catch(() => {});
  }, [lang]);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v && v !== "") q.set(k, v);
    });
    q.set("per_page", "24");
    api.get(`/api/search?${q.toString()}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [query]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === "" || value == null) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: false });
  };

  const topCats = categories.filter((c) => !c.parent_id);
  const selectedCat = topCats.find((c) => c.slug === query.category);
  const subs = selectedCat ? categories.filter((c) => c.parent_id === selectedCat.id) : [];

  const regions = useMemo(() => {
    const map = {};
    locations.forEach((l) => {
      const r = l.region || "Annað";
      if (!map[r]) map[r] = [];
      map[r].push(l);
    });
    return Object.entries(map).sort((a, b) => b[1].reduce((s, l) => s + l.listing_count, 0) - a[1].reduce((s, l) => s + l.listing_count, 0));
  }, [locations]);

  const [openRegions, setOpenRegions] = useState({});
  const toggleRegion = (r) => setOpenRegions((prev) => ({ ...prev, [r]: !prev[r] }));

  return (
    <div className="section">
      <div className="container">
      <div className="section-head">
        <h2 className="mt0">
          {query.keyword ? `Results for "${query.keyword}"` : t("search.allRentals")}
          {data && <span className="muted" style={{ fontSize: 15 }}> · {t("search.found").replace("{n}", data.total)}</span>}
        </h2>
      </div>

      <div className="sort-row">
        <select value={query.sort} onChange={(e) => update("sort", e.target.value)}>
          {SORTS.map(([v, key]) => (
            <option key={v} value={v}>{t(key)}</option>
          ))}
        </select>
        <span className="results-info">
          {t("search.shown").replace("{n}", data?.results?.length || 0)}
        </span>
      </div>
      </div>

      <div className="container">
      <div className="split">
        <aside className="filter-panel">
          <h4 className="mt0">{t("search.filter.category")}</h4>
          <div className="category-filter">
            <button
              className={`category-filter-item ${query.category === "" ? "active" : ""}`}
              onClick={() => { const next = new URLSearchParams(params); next.delete("category"); next.delete("subcategory"); setParams(next, { replace: false }); }}
            >
              {t("search.allCategories")}
            </button>
            {topCats.map((c) => (
              <button
                key={c.id}
                className={`category-filter-item ${query.category === c.slug ? "active" : ""}`}
                onClick={() => { const next = new URLSearchParams(params); next.set("category", c.slug); next.delete("subcategory"); setParams(next, { replace: false }); }}
              >
                <CategoryIcon slug={c.slug} size={20} />
                <span className="category-filter-name">{c.name}</span>
                {c.listing_count > 0 && <span className="tree-count">{c.listing_count}</span>}
              </button>
            ))}
          </div>
          {query.category && subs.length > 0 && (
            <div className="field" style={{ marginTop: 8 }}>
              <select value={query.subcategory} onChange={(e) => update("subcategory", e.target.value)}>
                <option value="">{t("search.allSubcategories")}</option>
                {subs.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <h4>{t("search.filter.location")}</h4>
          <div className="location-tree">
            <button
              className={`location-tree-item ${query.location === "" ? "active" : ""}`}
              onClick={() => update("location", "")}
            >
              {t("search.allIceland")}
            </button>
            {regions.map(([region, locs]) => (
              <div key={region}>
                <button
                  className={`location-tree-item region ${openRegions[region] ? "open" : ""}`}
                  onClick={() => toggleRegion(region)}
                >
                  <span className="tree-toggle">{openRegions[region] ? "−" : "+"}</span>
                  {region}
                  <span className="tree-count">{locs.length}</span>
                </button>
                {openRegions[region] && (
                  <div className="location-tree-children">
                    {locs.map((l) => (
                      <button
                        key={l.id}
                        className={`location-tree-item ${query.location === l.city ? "active" : ""}`}
                        onClick={() => update("location", l.city)}
                      >
                        {l.city}
                        {l.listing_count > 0 && <span className="tree-count">{l.listing_count}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <h4>{t("listing.check")}</h4>
          <div className="field">
            <label className="muted">{t("hero.from")} ({t("search.filter.dateOpt")})</label>
            <input
              type="date"
              lang="is"
              value={query.start ? query.start.slice(0, 10) : ""}
              onChange={(e) => update("start", e.target.value ? `${e.target.value}T10:00:00` : "")}
            />
          </div>
          <div className="field">
            <label className="muted">{t("hero.to")} ({t("search.filter.dateOpt")})</label>
            <input
              type="date"
              lang="is"
              value={query.end ? query.end.slice(0, 10) : ""}
              onChange={(e) => update("end", e.target.value ? `${e.target.value}T10:00:00` : "")}
            />
          </div>

          <h4>{t("search.filter.price")}</h4>
          <div className="row">
            <div className="field grow">
              <input
                type="number"
                min="0"
                placeholder={t("search.filter.min")}
                value={query.min_price}
                onChange={(e) => update("min_price", e.target.value)}
              />
            </div>
            <div className="field grow">
              <input
                type="number"
                min="0"
                placeholder={t("search.filter.max")}
                value={query.max_price}
                onChange={(e) => update("max_price", e.target.value)}
              />
            </div>
          </div>

          <h4>{t("search.filter.features")}</h4>
          <label className="row" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={query.verified} onChange={(e) => update("verified", e.target.checked ? "1" : "")} />
            {t("search.filter.verified")}
          </label>
          <label className="row" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={query.delivery} onChange={(e) => update("delivery", e.target.checked ? "1" : "")} />
            {t("search.filter.delivery")}
          </label>
          <label className="row" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={query.instant} onChange={(e) => update("instant", e.target.checked ? "1" : "")} />
            {t("search.filter.instant")}
          </label>
        </aside>

        <div>
          {loading ? (
            <div className="empty">{t("search.loading")}</div>
          ) : !data || data.results.length === 0 ? (
            <div className="empty">
              <h3>{t("search.noResults")}</h3>
              <p>{t("search.tryAgain")}</p>
            </div>
          ) : (
            <div className="grid">
              {data.results.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}

          {data && data.pages > 1 && (
            <Pager page={data.page} pages={data.pages} onChange={(p) => update("page", p > 1 ? String(p) : "")} />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

function Pager({ page, pages, onChange }) {
  const options = [];
  for (let i = 1; i <= pages; i++) options.push(i);
  return (
    <div className="row" style={{ justifyContent: "center", marginTop: 20 }}>
      <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>←</button>
      {options.slice(Math.max(0, page - 3), Math.min(pages, page + 2)).map((p) => (
        <button key={p} className={`btn btn-sm ${p === page ? "btn-primary" : "btn-outline"}`} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
      <button className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>→</button>
    </div>
  );
}