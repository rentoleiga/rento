import React from "react";
import { useLang } from "../i18n";

export default function PrivacyPage() {
  const { t } = useLang();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>{t("privacy.title")}</h1>
        <p className="muted">{t("privacy.updated")}</p>

        <div className="detail-section">
          <h3>{t("privacy.s1.title")}</h3>
          <p>{t("privacy.s1.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("privacy.s2.title")}</h3>
          <p>{t("privacy.s2.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("privacy.s3.title")}</h3>
          <p>{t("privacy.s3.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("privacy.s4.title")}</h3>
          <p>{t("privacy.s4.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("privacy.s5.title")}</h3>
          <p>{t("privacy.s5.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("privacy.contact")} <a href="mailto:info@rento.is">info@rento.is</a></h3>
        </div>
      </div>
    </section>
  );
}
