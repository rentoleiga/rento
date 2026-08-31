import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";

const PLAN_FEATURES = {
  silver: [
    { k: "premium.silver.badge", icon: "🏷️" },
    { k: "premium.silver.frame", icon: "🖼️" },
    { k: "premium.silver.priority", icon: "↥" },
  ],
  gold: [
    { k: "premium.gold.include", icon: "✓" },
    { k: "premium.gold.priority", icon: "↥↥" },
    { k: "premium.gold.home", icon: "🏠" },
  ],
  platinum: [
    { k: "premium.platinum.include", icon: "✓" },
    { k: "premium.platinum.priority", icon: "☝" },
    { k: "premium.platinum.home", icon: "🥇" },
    { k: "premium.platinum.first", icon: "🏆" },
  ],
};

const PLANS = [
  { tier: "silver", priceKey: null, price: "250" },
  { tier: "gold", priceKey: "premium.mostPopular", price: "500" },
  { tier: "platinum", priceKey: null, price: "1.000" },
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
              <div className="perk-icon">👁️</div>
              <h3>{t("premium.viewsTitle")}</h3>
              <p className="muted">{t("premium.viewsText")}</p>
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

      <section className="section section-flush">
        <div className="container">
          <div className="plans-grid">
            {PLANS.map((plan) => (
              <div key={plan.tier} className={`plan-card plan-${plan.tier}`}>
                {plan.priceKey && <div className="plan-ribbon">{t(plan.priceKey)}</div>}
                <h3 className="plan-name">{t(`premium.${plan.tier}`)}</h3>
                <div className="plan-price">
                  <strong>{plan.price}</strong>
                  <span className="plan-unit">
                    {t("premium.currency")} {t("premium.per7")}
                  </span>
                </div>
                <ul className="plan-features">
                  {PLAN_FEATURES[plan.tier].map((f) => (
                    <li key={f.k}>
                      <span className="plan-check" aria-hidden="true">
                        {f.icon}
                      </span>
                      <span>{t(f.k)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/dashboard/listings"
                  className={`btn ${
                    plan.tier === "gold" ? "btn-primary" : "btn-outline"
                  } btn-block`}
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