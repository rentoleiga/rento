import React from "react";
import { useLang } from "../i18n";

export default function TermsPage() {
  const { t } = useLang();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>{t("terms.title")}</h1>
        <p className="muted">{t("terms.updated")}</p>

        <div className="detail-section">
          <h3>{t("terms.s1.title")}</h3>
          <p>{t("terms.s1.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("terms.s2.title")}</h3>
          <p>{t("terms.s2.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("terms.s3.title")}</h3>
          <p>{t("terms.s3.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("terms.s4.title")}</h3>
          <p>{t("terms.s4.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("terms.s5.title")}</h3>
          <p>{t("terms.s5.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("terms.s6.title")}</h3>
          <p>{t("terms.s6.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("terms.s7.title")}</h3>
          <p>{t("terms.contact")} <a href="mailto:info@rento.is">info@rento.is</a></p>
        </div>
      </div>
    </section>
  );
}
