import React from "react";
import { useLang } from "../i18n";

export default function BannedPage() {
  const { t } = useLang();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>{t("banned.title")}</h1>
        <p className="muted">{t("banned.sub")}</p>

        <div className="detail-section">
          <h3>{t("banned.illegal.title")}</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>{t("banned.illegal.1")}</li>
            <li>{t("banned.illegal.2")}</li>
            <li>{t("banned.illegal.3")}</li>
            <li>{t("banned.illegal.4")}</li>
          </ul>
        </div>
        <div className="detail-section">
          <h3>{t("banned.dangerous.title")}</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>{t("banned.dangerous.1")}</li>
            <li>{t("banned.dangerous.2")}</li>
            <li>{t("banned.dangerous.3")}</li>
          </ul>
        </div>
        <div className="detail-section">
          <h3>{t("banned.documents.title")}</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>{t("banned.documents.1")}</li>
            <li>{t("banned.documents.2")}</li>
            <li>{t("banned.documents.3")}</li>
          </ul>
        </div>
        <div className="detail-section">
          <h3>{t("banned.punishment.title")}</h3>
          <p>{t("banned.punishment.text")}</p>
        </div>
        <div className="detail-section">
          <h3>{t("banned.contact")} <a href="mailto:info@rento.is">info@rento.is</a></h3>
        </div>
      </div>
    </section>
  );
}
