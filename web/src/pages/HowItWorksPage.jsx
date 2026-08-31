import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";

const STEPS = ["home.step.find", "home.step.book", "home.step.pickup", "home.step.return", "home.step.review"];
const STEP_DESCS = [
  "how.step.find.desc",
  "how.step.book.desc",
  "how.step.pickup.desc",
  "how.step.return.desc",
  "how.step.review.desc",
];

export default function HowItWorksPage() {
  const { t } = useLang();
  return (
    <>
      <section className="hero" style={{ padding: "64px 0 56px" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: 760 }}>
          <h1 style={{ marginBottom: 12 }}>{t("how.hero.title")}</h1>
          <p style={{ fontSize: 18, color: "var(--ink-soft)", margin: "0 auto" }}>{t("how.hero.sub")}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head" style={{ justifyContent: "center" }}>
            <h2>{t("home.how")}</h2>
          </div>
          <div className="grid steps-grid" style={{ marginTop: 22 }}>
            {STEPS.map((key, i) => (
              <div key={key} className="card step-card" style={{ textAlign: "center", padding: 24 }}>
                <div className="stat-num step-num">{i + 1}</div>
                <strong style={{ display: "block", fontSize: 17, marginBottom: 6 }}>{t(key)}</strong>
                <p className="muted" style={{ fontSize: 14, margin: 0 }}>
                  {t(STEP_DESCS[i])}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="card" style={{ padding: 32, textAlign: "center" }}>
            <h3 className="mt0">{t("home.ctaTitle")}</h3>
            <p className="muted">{t("home.ctaSub")}</p>
            <Link to="/dashboard/listings/new" className="btn btn-primary">
              {t("home.listItem")}
            </Link>
          </div>

          <div className="card" style={{ marginTop: 18, padding: 24 }}>
            <h3 style={{ marginTop: 0 }}>{t("how.faq.title")}</h3>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <strong>{t("how.faq.q1")}</strong>
                <p className="muted" style={{ margin: "4px 0 0", fontSize: 14 }}>
                  {t("how.faq.a1")}
                </p>
              </div>
              <div>
                <strong>{t("how.faq.q2")}</strong>
                <p className="muted" style={{ margin: "4px 0 0", fontSize: 14 }}>
                  {t("how.faq.a2")}
                </p>
              </div>
              <div>
                <strong>{t("how.faq.q3")}</strong>
                <p className="muted" style={{ margin: "4px 0 0", fontSize: 14 }}>
                  {t("how.faq.a3")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
