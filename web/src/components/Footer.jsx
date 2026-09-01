import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <strong>Rento</strong>
          <p className="muted">{t("footer.tag")}</p>
        </div>
        <div className="footer-cols">
          <div className="footer-col">
            <h4>{t("footer.explore")}</h4>
            <Link to="/how-it-works" className="footer-link">{t("footer.how")}</Link>
            <Link to="/search" className="footer-link">{t("footer.browse")}</Link>
            <Link to="/calculator" className="footer-link">{t("calc.title")}</Link>
          </div>
          <div className="footer-col">
            <h4>{t("footer.earn")}</h4>
            <Link to="/dashboard/listings/new" className="footer-link">{t("footer.list")}</Link>
            <Link to="/promote" className="footer-link">{t("footer.promote")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
