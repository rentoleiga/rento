import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatPrice } from "../api";
import { useLang } from "../i18n";

const AVG_RENTAL_DAYS = 3;

function MiniStars({ n }) {
  return (
    <span className="stars-mini" aria-label={n + "/5 demand"}>
      {"★".repeat(n)}
      <span className="stars-ghost">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default function CalculatorPage() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");
  const [price, setPrice] = useState(0);
  const [days, setDays] = useState(22);
  const [occupancy, setOccupancy] = useState(55);

  useEffect(() => {
    api.get("/api/estimate")
      .then(setData)
      .catch(() => setData({ categories: [], subcategories: [] }));
  }, []);

  const activeSub = useMemo(
    () => data?.subcategories?.find((s) => s.slug === sub) || null,
    [data, sub]
  );

  const applySub = (s) => {
    setSub(s.slug);
    setPrice(s.suggestedDaily);
    setOccupancy(s.occupancy);
    setDays(22);
  };

  const onCat = (slug) => {
    setCat(slug);
    const first = data?.categories.find((c) => c.slug === slug);
    const f = first?.subcategories?.[0];
    if (f) applySub(f);
    else {
      setSub("");
      setPrice(0);
    }
  };

  const grossMonthly = Math.round(price * days * (occupancy / 100));
  const feePct = data?.platformFeePct ?? 10;
  const fee = Math.round(grossMonthly * (feePct / 100));
  const netMonthly = grossMonthly - fee;
  const netYearly = netMonthly * 12;
  const estBookings = Math.max(0, Math.round((days * (occupancy / 100)) / AVG_RENTAL_DAYS));

  const opportunities = useMemo(() => {
    if (!data?.subcategories) return [];
    return [...data.subcategories]
      .map((s) => ({ ...s, monthly: Math.round(s.suggestedDaily * 22 * (s.occupancy / 100)) }))
      .sort((a, b) => b.monthly - a.monthly);
  }, [data]);

  const subList = cat
    ? data?.categories.find((c) => c.slug === cat)?.subcategories || []
    : data?.subcategories || [];

  return (
    <>
      <section className="hero hero-calc">
        <div className="container">
          <h1>{t("calc.title")}</h1>
          <p>{t("calc.sub")}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="calc-layout">
          <div className="card calc-panel">
            <h3 className="mt0">{t("calc.configure")}</h3>

            <div className="row">
              <div className="field grow">
                <label>{t("calc.category")}</label>
                <select value={cat} onChange={(e) => onCat(e.target.value)}>
                  <option value="">{t("calc.allCategories")}</option>
                  {data?.categories?.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field grow">
                <label>{t("calc.item")}</label>
                <select
                  value={sub}
                  onChange={(e) => {
                    const s = data?.subcategories.find((x) => x.slug === e.target.value);
                    if (s) applySub(s);
                  }}
                >
                  <option value="">{t("calc.chooseItem")}</option>
                  {subList.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>
                {t("calc.pricePerDay")}
                {activeSub ? " - " + t("calc.suggested") + " " + formatPrice(activeSub.suggestedDaily) : ""}
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>

            <div className="field">
              <label>{t("calc.daysPerMonth")}</label>
              <div className="calc-slider">
                <input type="range" min="1" max="30" value={days} onChange={(e) => setDays(Number(e.target.value))} />
                <output>{days}</output>
              </div>
            </div>

            <div className="field">
              <label>{t("calc.occupancy")}</label>
              <div className="calc-slider">
                <input type="range" min="5" max="100" step="5" value={occupancy} onChange={(e) => setOccupancy(Number(e.target.value))} />
                <output>{occupancy}%</output>
              </div>
            </div>

            {activeSub && (
              <p className="calc-hint muted">
                {t("calc.demand")} <MiniStars n={activeSub.demand} /> -{" "}
                {activeSub.listingsCount} {t("calc.liveListings")}
              </p>
            )}
          </div>

          <div className="card calc-result">
            <h3 className="mt0">{t("calc.yourEstimate")}</h3>
            <div className="result-big">
              <span className="muted">{t("calc.netMonthly")}</span>
              <strong>{formatPrice(netMonthly)}</strong>
            </div>
            <ul className="result-lines">
              <li>
                <span>{t("calc.grossMonthly")}</span>
                <span>{formatPrice(grossMonthly)}</span>
              </li>
              <li>
                <span>{t("calc.platformFee", { pct: feePct })}</span>
                <span>-{formatPrice(fee)}</span>
              </li>
              <li className="strong">
                <span>{t("calc.netYearly")}</span>
                <span>{formatPrice(netYearly)}</span>
              </li>
              <li>
                <span>{t("calc.estBookings")}</span>
                <span>{estBookings}</span>
              </li>
            </ul>
            <Link to="/dashboard/listings/new" className="btn btn-primary btn-block">
              {t("calc.startListing")}
            </Link>
          </div>
        </div>
        </div>

        <div className="container" style={{ marginTop: 48 }}>
          <div className="section-head">
            <h2>{t("calc.bestOpportunities")}</h2>
            <span className="muted" style={{ fontSize: 14 }}>{t("calc.basedOnMarket")}</span>
          </div>
          <div className="opp-table">
            <div className="opp-row opp-head">
              <span>{t("calc.item")}</span>
              <span>{t("calc.demand")}</span>
              <span>{t("calc.suggestedPrice")}</span>
              <span>{t("calc.suggestedMonthly")}</span>
              <span></span>
            </div>
            {opportunities.slice(0, 10).map((s) => (
              <div key={s.slug} className="opp-row">
                <span className="opp-name">{s.name}</span>
                <span><MiniStars n={s.demand} /></span>
                <span>{formatPrice(s.suggestedDaily)}</span>
                <span><strong>{formatPrice(s.monthly)}</strong></span>
                <span>
                  <button className="btn btn-outline btn-sm" onClick={() => applySub(s)}>
                    {t("calc.use")}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
