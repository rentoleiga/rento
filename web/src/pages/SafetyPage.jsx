import React from "react";
import { useLang } from "../i18n";

export default function SafetyPage() {
  const { t } = useLang();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>{t("safety.title")}</h1>
        <p className="muted">{t("safety.sub")}</p>

        <div className="detail-section">
          <h3>{t("safety.verified.title")}</h3>
          <p>{t("safety.verified.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("safety.payments.title")}</h3>
          <p>{t("safety.payments.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("safety.deposit.title")}</h3>
          <p>{t("safety.deposit.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("safety.reviews.title")}</h3>
          <p>{t("safety.reviews.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("safety.report.title")}</h3>
          <p>{t("safety.report.text")} <a href="mailto:info@rento.is">info@rento.is</a></p>
        </div>
        <div className="detail-section">
          <h3>{t("safety.tips.title")}</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>{t("safety.tips.1")}</li>
            <li>{t("safety.tips.2")}</li>
            <li>{t("safety.tips.3")}</li>
            <li>{t("safety.tips.4")}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
