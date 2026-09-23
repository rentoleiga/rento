import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";

const SUBSCRIPTIONS = [
  {
    id: "free",
    nameKey: "sub.free",
    priceKey: "sub.free.price",
    unitKey: null,
    badge: null,
    ctaKey: "sub.cta.free",
    features: ["sub.free.f1", "sub.free.f2", "sub.free.f3"],
    variant: "free",
  },
  {
    id: "basic",
    nameKey: "sub.basic",
    priceKey: "sub.basic.price",
    unitKey: "sub.perMonth",
    badge: "sub.mostPopular",
    ctaKey: "sub.cta.basic",
    features: ["sub.basic.f1", "sub.basic.f2", "sub.basic.f3", "sub.basic.f4"],
    variant: "gold",
  },
  {
    id: "pro",
    nameKey: "sub.pro",
    priceKey: "sub.pro.price",
    unitKey: "sub.perMonth",
    badge: "sub.forCompanies",
    ctaKey: "sub.cta.pro",
    features: ["sub.pro.f1", "sub.pro.f2", "sub.pro.f3", "sub.pro.f4", "sub.pro.f5"],
    variant: "platinum",
  },
];

const BOOSTS = [
  {
    tier: "silver",
    priceKey: "boost.silver.price",
    ribbon: null,
    features: ["premium.silver.badge", "premium.silver.frame", "premium.silver.priority"],
    icons: ["🏷️", "🖼️", "↥"],
  },
  {
    tier: "gold",
    priceKey: "boost.gold.price",
    ribbon: "premium.mostPopular",
    features: ["premium.gold.include", "premium.gold.priority", "premium.gold.home"],
    icons: ["✓", "↥↥", "🏠"],
  },
  {
    tier: "platinum",
    priceKey: "boost.platinum.price",
    ribbon: null,
    features: ["premium.platinum.include", "premium.platinum.priority", "premium.platinum.home", "premium.platinum.first"],
    icons: ["✓", "☝", "🥇", "🏆"],
  },
];

export default function PremiumPage() {
  const { t } = useLang();

  return (
    <>
      <section className="hero hero-premium">
        <div className="container">
          <h1>{t("premium.title")}</h1>
          <p>{t("premium.tag")}</p>
          <Link to="/dashboard/listings" className="btn btn-primary">
            {t("premium.cta")}
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("premium.why")}</h2>
          </div>
          <p className="perks-sub">{t("premium.whySub")}</p>
          <div className="perks-grid">
            <div className="perk-card">
              <div className="perk-icon">✦</div>
              <h3>30 / 60 / 150</h3>
              <p className="muted">Ókeypis 30 · Basic 60 · Pro 150 virkar auglýsingar</p>
            </div>
            <div className="perk-card">
              <div className="perk-icon">🏠</div>
              <h3>{t("premium.homeTitle")}</h3>
              <p className="muted">{t("premium.homeText")}</p>
            </div>
            <div className="perk-card">
              <div className="perk-icon">💰</div>
              <h3>{t("premium.worthTitle")}</h3>
              <p className="muted">{t("premium.worthText")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pretplata */}
      <section className="section section-flush" style={{ background: "#f6f8f7" }}>
        <div className="container">
          <div className="section-head" style={{ justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
            <h2>{t("sub.title")}</h2>
            <p className="muted" style={{ margin: "8px 0 0", maxWidth: 640 }}>Engin þóknun á hverja leigu. Borgaðu aðeins ef þú vilt fleiri auglýsingar eða meiri sýnileika.</p>
          </div>
          <div className="plans-grid" style={{ marginTop: 28 }}>
            {SUBSCRIPTIONS.map((s) => (
              <div key={s.id} className={`plan-card plan-${s.variant} ${s.id === "pro" ? "plan-pro" : ""}`}>
                {s.badge && <div className="plan-ribbon">{t(s.badge)}</div>}
                <h3 className="plan-name">{t(s.nameKey)}</h3>
                <div className="plan-price">
                  <strong>{t(s.priceKey)}</strong>
                  <span className="plan-unit">
                    {s.unitKey ? `${t("premium.currency")} ${t(s.unitKey)}` : t("premium.currency")}
                  </span>
                </div>
                <ul className="plan-features">
                  {s.features.map((k, i) => (
                    <li key={k}>
                      <span className="plan-check" aria-hidden="true">✓</span>
                      <span>{t(k)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={s.id === "free" ? "/dashboard/listings/new" : "/contact"}
                  className={`btn ${s.id === "basic" ? "btn-primary" : s.id === "pro" ? "btn-primary" : "btn-outline"} btn-block`}
                >
                  {t(s.ctaKey)}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Boost */}
      <section className="section">
        <div className="container">
          <div className="section-head" style={{ justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
            <h2>{t("boost.title")}</h2>
            <p className="muted" style={{ margin: "8px 0 0", maxWidth: 640 }}>{t("boost.sub")}</p>
          </div>
          <div className="plans-grid" style={{ marginTop: 28 }}>
            {BOOSTS.map((plan) => (
              <div key={plan.tier} className={`plan-card plan-${plan.tier}`}>
                {plan.ribbon && <div className="plan-ribbon">{t(plan.ribbon)}</div>}
                <h3 className="plan-name">{t(`premium.${plan.tier}`)}</h3>
                <div className="plan-price">
                  <strong>{t(plan.priceKey)}</strong>
                  <span className="plan-unit">
                    {t("premium.currency")} {t("premium.per7")}
                  </span>
                </div>
                <ul className="plan-features">
                  {plan.features.map((k, i) => (
                    <li key={k}>
                      <span className="plan-check" aria-hidden="true">
                        {plan.icons[i] || "✓"}
                      </span>
                      <span>{t(k)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/dashboard/listings"
                  className={`btn ${plan.tier === "gold" ? "btn-primary" : "btn-outline"} btn-block`}
                >
                  {t("premium.cta")}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
