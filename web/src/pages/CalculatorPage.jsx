import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useLang } from "../i18n";

const isk = (n) => `${String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} kr.`;
const num = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const TIP_ICONS = [
  <svg key="tag" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  <svg key="compare" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 13"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  <svg key="wrench" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  <svg key="calendar" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  <svg key="trend" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
];

export default function CalculatorPage() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");
  const [price, setPrice] = useState(0);
  const [value, setValue] = useState(150000);
  const [days, setDays] = useState(10);

  useEffect(() => {
    api.get("/api/estimate")
      .then(setData)
      .catch(() => setData({ categories: [], subcategories: [] }));
  }, []);

  const applySub = (s) => {
    setSub(s.slug);
    setPrice(s.suggestedDaily);
    setDays(10);
  };

  const onCat = (slug) => {
    setCat(slug);
    const first = data?.categories.find((c) => c.slug === slug);
    const f = first?.subcategories?.[0];
    if (f) applySub(f);
    else setSub("");
  };

  const monthly = price * days;
  const yearly = monthly * 12;
  const payDays = price > 0 && value > 0 ? Math.ceil(value / price) : 0;
  const payMonths = payDays > 0 && days > 0 ? Math.ceil(payDays / days) : 0;

  const subList = cat
    ? data?.categories.find((c) => c.slug === cat)?.subcategories || []
    : data?.subcategories || [];

  return (
    <>
      <section className="hero hero-calc">
        <div className="container">
          <h1>{t("calc.title")}</h1>
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

            <div className="row">
              <div className="field grow">
                <label>{t("calc.pricePerDay")}</label>
                <div className="field-with-suffix">
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                  />
                  <span>kr.</span>
                </div>
              </div>
              <div className="field grow">
                <label>{t("calc.purchasePrice")}</label>
                <div className="field-with-suffix">
                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))}
                  />
                  <span>kr.</span>
                </div>
              </div>
            </div>

            <div className="field">
              <label>{t("calc.daysPerMonth")}</label>
              <div className="calc-slider">
                <input type="range" min="1" max="30" value={days} onChange={(e) => setDays(Number(e.target.value))} />
                <output>{days}</output>
              </div>
            </div>
          </div>

          <div className="card calc-result calc-result-dark">
            <h3 className="mt0">{t("calc.yourEstimate")}</h3>
            <p className="calc-result-eyebrow">{t("calc.estMonthly")}</p>
            <div className="result-big">
              <strong>{num(monthly)}<span className="result-unit"> kr.</span></strong>
              <span className="result-formula">{num(price)} kr. × {days} {t("calc.daysWord")}</span>
            </div>
            <ul className="result-lines">
              <li className="strong">
                <span>{t("calc.estYearly")}</span>
                <span>{isk(yearly)}</span>
              </li>
            </ul>
            <p className="calc-subhead">{t("calc.breakEven")}</p>
            <div className="calc-breve">
              <div>
                <span>{t("calc.daysToPayBack")}</span>
                <strong>{num(payDays)} <em>{t("calc.daysWord")}</em></strong>
              </div>
              <div>
                <span>{t("calc.estTime")}</span>
                <strong>{num(payMonths)} <em>{t("calc.monthsWord")}</em></strong>
              </div>
            </div>
            <Link to="/dashboard/listings/new" className="btn btn-primary btn-block">
              {t("calc.startListing")}
            </Link>
          </div>
        </div>
        </div>

      </section>

      {/* Hvernig ákveður þú leiguverð? */}
      <section className="calc-tips">
        <div className="container">
          <div className="calc-tips-head">
            <h2>{t("calc.tips.title")}</h2>
            <p>{t("calc.tips.intro")}</p>
          </div>
          <div className="calc-tips-grid">
            {[1, 2, 3, 4, 5].map((i) => (
              <div className="calc-tip-card" key={i}>
                <span className="calc-tip-icon">{TIP_ICONS[i - 1]}</span>
                <h4>{t(`calc.tips.t${i}`)}</h4>
                <p>{t(`calc.tips.b${i}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="calc-cta">
        <div className="container">
          <h2>{t("calc.cta.title")}</h2>
          <p>{t("calc.cta.sub")}</p>
          <Link to="/dashboard/listings/new" className="btn btn-primary">{t("calc.cta.btn")}</Link>
        </div>
      </section>
    </>
  );
}
