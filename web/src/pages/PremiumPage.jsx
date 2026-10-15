import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { useAuth } from "../store";

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const PACKAGES = [
  { id: "litill", nameKey: "credit.pk.litill", credits: 999, price: "999", descKey: "credit.pk.desc.litill", popular: false },
  { id: "vinsaell", nameKey: "credit.pk.vinsaell", credits: 2700, price: "2.499", descKey: "credit.pk.desc.vinsaell", popular: true },
  { id: "stor", nameKey: "credit.pk.stor", credits: 5800, price: "4.999", descKey: "credit.pk.desc.stor", popular: false },
  { id: "fyrirtaeki", nameKey: "credit.pk.fyrirtaeki", credits: 12000, price: "9.999", descKey: "credit.pk.desc.fyrirtaeki", popular: false },
];

const BOOSTS = [
  { tier: "silver", kredit: 150, daysKey: "credit.boost.days7", features: ["credit.boost.marked", "credit.boost.above"] },
  { tier: "gold", kredit: 590, daysKey: "credit.boost.days14", features: ["credit.boost.allSilver", "credit.boost.prioritySilver", "credit.boost.homepage"] },
  { tier: "platinum", kredit: 1250, daysKey: "credit.boost.days30", features: ["credit.boost.allGold", "credit.boost.maxPriority", "credit.boost.specialArea"] },
];

export default function PremiumPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const buyPath = user ? "/dashboard/credits" : "/login?next=/dashboard/credits";

  return (
    <>
      <section className="hero hero-premium">
        <div className="container">
          <h1>{t("credit.hero.title")}</h1>
          <p>{t("credit.hero.sub")}</p>
          <div className="credit-stats">
            <div className="credit-stat"><strong>0%</strong><span>{t("credit.stat.commission")}</span></div>
            <div className="credit-stat"><strong>3</strong><span>{t("credit.stat.free")}</span></div>
            <div className="credit-stat"><strong>0</strong><span>{t("credit.stat.sub")}</span></div>
          </div>
          <a href="#kreditpakar" className="btn btn-primary">{t("credit.hero.cta")}</a>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="perks-grid">
            <div className="perk-card">
              <div className="perk-icon">🎁</div>
              <h3>{t("credit.free.title")}</h3>
              <p className="muted">{t("credit.free.text")}</p>
            </div>
            <div className="perk-card">
              <div className="perk-icon">🪙</div>
              <h3>{t("credit.credit.title")}</h3>
              <p className="muted">{t("credit.credit.text")}</p>
            </div>
            <div className="perk-card">
              <div className="perk-icon">🚀</div>
              <h3>{t("credit.boost.title")}</h3>
              <p className="muted">{t("credit.boost.text")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What is credit */}
      <section className="section section-flush" style={{ background: "#f6f8f7" }}>
        <div className="container">
          <div className="section-head" style={{ justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
            <h2>{t("credit.what.title")}</h2>
            <p className="muted" style={{ margin: "8px 0 0", maxWidth: 720 }}>{t("credit.what.text")}</p>
          </div>
          <div className="perks-grid" style={{ marginTop: 24 }}>
            <div className="perk-card"><div className="perk-icon">♾️</div><h3>{t("credit.what.k1")}</h3><p className="muted">{t("credit.what.k1t")}</p></div>
            <div className="perk-card"><div className="perk-icon">🚫</div><h3>{t("credit.what.k2")}</h3><p className="muted">{t("credit.what.k2t")}</p></div>
            <div className="perk-card"><div className="perk-icon">🧾</div><h3>{t("credit.what.k3")}</h3><p className="muted">{t("credit.what.k3t")}</p></div>
          </div>
        </div>
      </section>

      {/* Kreditpakar */}
      <section className="section" id="kreditpakar">
        <div className="container">
          <div className="section-head" style={{ justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
            <h2>{t("credit.pk.title")}</h2>
          </div>
          <div className="plans-grid" style={{ marginTop: 28 }}>
            {PACKAGES.map((p) => (
              <div key={p.id} className={`plan-card plan-${p.id === "fyrirtaeki" ? "platinum" : p.popular ? "gold" : "free"}`}>
                {p.popular && <div className="plan-ribbon">{t("credit.pk.popular")}</div>}
                <h3 className="plan-name">{t(p.nameKey)}</h3>
                <div className="plan-price">
                  <strong>{fmt(p.credits)}</strong>
                  <span className="plan-unit">{t("credit.pk.kredit")}</span>
                </div>
                <div className="credit-price">{p.price} {t("credit.pk.currency")}</div>
                <div className="credit-per">{t(p.descKey)}</div>
                <Link to={buyPath} className={`btn ${p.popular || p.id === "fyrirtaeki" ? "btn-primary" : "btn-outline"} btn-block`}>{t("credit.pk.buy")}</Link>
              </div>
            ))}
          </div>

          {/* How slots work */}
          <div className="section-head" style={{ justifyContent: "center", marginTop: 56 }}>
            <h2>{t("credit.slots.title")}</h2>
          </div>
          <div className="credit-steps">
            <div className="credit-step"><span className="credit-step-n">1</span><h3>{t("credit.slots.s1t")}</h3><p className="muted">{t("credit.slots.s1")}</p></div>
            <div className="credit-step"><span className="credit-step-n">2</span><h3>{t("credit.slots.s2t")}</h3><p className="muted">{t("credit.slots.s2")}</p></div>
            <div className="credit-step"><span className="credit-step-n">3</span><h3>{t("credit.slots.s3t")}</h3><p className="muted">{t("credit.slots.s3")}</p></div>
          </div>
          <p className="credit-example"><strong>{t("credit.slots.example")}</strong></p>
        </div>
      </section>

      {/* Boost */}
      <section className="section section-flush" style={{ background: "#0f2b24", color: "#e6f6f0" }}>
        <div className="container">
          <div className="section-head" style={{ justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
            <h2 style={{ color: "#fff" }}>{t("credit.boostPage.title")}</h2>
            <p style={{ margin: "8px 0 0", maxWidth: 680, color: "#bfe3d8" }}>{t("credit.boostPage.sub")}</p>
          </div>
          <div className="plans-grid" style={{ marginTop: 28 }}>
            {BOOSTS.map((b) => (
              <div key={b.tier} className={`plan-card plan-${b.tier}`}>
                <h3 className="plan-name">{t(`credit.boost.${b.tier}`)}</h3>
                <div className="plan-price">
                  <strong>{fmt(b.kredit)}</strong>
                  <span className="plan-unit">{t("credit.boost.kredit")}</span>
                </div>
                <div className="credit-price">{t(b.daysKey)}</div>
                <ul className="plan-features">
                  {b.features.map((k) => (
                    <li key={k}><span className="plan-check" aria-hidden="true">✓</span><span>{t(k)}</span></li>
                  ))}
                </ul>
                <Link to={buyPath} className="btn btn-primary btn-block">{t("credit.dash.boostListing")}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extra services: renew / add-ons / golden */}
      <section className="section">
        <div className="container">
          <div className="section-head" style={{ justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
            <h2>{t("credit.extra.title")}</h2>
            <p className="muted" style={{ margin: "8px 0 0", maxWidth: 720 }}>{t("credit.extra.sub")}</p>
          </div>
          <div className="perks-grid" style={{ marginTop: 24 }}>
            <div className="perk-card"><div className="perk-icon">🔁</div><h3>{t("credit.extra.renew.title")}</h3><p className="muted">{t("credit.extra.renew.text")}</p></div>
            <div className="perk-card"><div className="perk-icon">🧩</div><h3>{t("credit.extra.addons.title")}</h3><p className="muted">{t("credit.extra.addons.text")}</p></div>
            <div className="perk-card"><div className="perk-icon">✨</div><h3>{t("credit.extra.golden.title")}</h3><p className="muted">{t("credit.extra.golden.text")}</p></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div className="detail-section" style={{ textAlign: "center" }}>
            <h2>{t("credit.cta.title")}</h2>
            <p className="muted">{t("credit.cta.sub")}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
              <Link to="/dashboard/listings/new" className="btn btn-primary">{t("credit.cta.list")}</Link>
              <Link to="/how-it-works" className="btn btn-outline">{t("credit.cta.how")}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
