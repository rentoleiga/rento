import React from "react";
import { useLang } from "../i18n";

export default function CookiesPage() {
  const { t } = useLang();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>{t("cookies.title")}</h1>
        <p className="muted">{t("cookies.updated")}</p>

        <div className="detail-section">
          <h3>{t("cookies.what.title")}</h3>
          <p>{t("cookies.what.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("cookies.types.title")}</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li><strong>{t("cookies.types.necessary")}</strong></li>
            <li><strong>{t("cookies.types.analytics")}</strong></li>
            <li><strong>{t("cookies.types.marketing")}</strong></li>
          </ul>
        </div>
        <div className="detail-section">
          <h3>{t("cookies.manage.title")}</h3>
          <p>{t("cookies.manage.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("cookies.contact")} <a href="mailto:info@rento.is">info@rento.is</a></h3>
        </div>
      </div>
    </section>
  );
}
