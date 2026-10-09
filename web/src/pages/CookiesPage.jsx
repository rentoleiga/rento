import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";

export default function CookiesPage() {
  const { t } = useLang();
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1>{t("cookies.title")}</h1>
        <p className="muted">{t("cookies.updated")}</p>
        <p style={{ marginTop: 12 }}>{t("cookies.intro")}</p>

        <div className="detail-section">
          <h3>{t("cookies.what.title")}</h3>
          <p>{t("cookies.what.text")}</p>
        </div>

        <div className="detail-section">
          <h3>{t("cookies.types.title")}</h3>
          <h4 style={{ marginBottom: 8 }}>{t("cookies.necessary.title")}</h4>
          <p style={{ marginTop: 0 }}>{t("cookies.necessary.text")}</p>
          <ul style={{ margin: "0 0 12px", paddingLeft: 20 }}>
            <li>{t("cookies.necessary.i1")}</li>
            <li>{t("cookies.necessary.i2")}</li>
            <li>{t("cookies.necessary.i3")}</li>
            <li>{t("cookies.necessary.i4")}</li>
            <li>{t("cookies.necessary.i5")}</li>
            <li>{t("cookies.necessary.i6")}</li>
          </ul>
          <p className="muted">{t("cookies.necessary.note")}</p>
          <h4 style={{ marginBottom: 8, marginTop: 20 }}>{t("cookies.other.title")}</h4>
          <p style={{ marginTop: 0 }}>{t("cookies.other.text")}</p>
        </div>

        <div className="detail-section">
          <h3>{t("cookies.consent.title")}</h3>
          <p>{t("cookies.consent.text")}</p>
        </div>

        <div className="detail-section">
          <h3>{t("cookies.privacy.title")}</h3>
          <p>{t("cookies.privacy.text")}</p>
          <p style={{ marginBottom: 0 }}><Link to="/privacy">{t("footer.privacy")}</Link></p>
        </div>

        <div className="detail-section">
          <h3>{t("cookies.contact.title")}</h3>
          <p>{t("cookies.contact.text")}</p>
          <p style={{ marginBottom: 0 }}>Rentó</p>
          <p style={{ margin: 0 }}>Netfang: <a href="mailto:rento@rento.is">rento@rento.is</a></p>
          <p style={{ margin: 0 }}>Vefsíða: <a href="https://rento.is">rento.is</a></p>
        </div>
      </div>
    </section>
  );
}
