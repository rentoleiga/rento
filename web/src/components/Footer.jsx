import React from "react";
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
            <Link href="/how-it-works">{t("footer.how")}</Link>
            <Link href="/search">{t("footer.browse")}</Link>
            <Link href="/calculator">{t("calc.title")}</Link>
          </div>
          <div className="footer-col">
            <h4>{t("footer.earn")}</h4>
            <Link href="/dashboard/listings/new">{t("footer.list")}</Link>
            <Link href="/promote">{t("footer.promote")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Link({ href, children }) {
  return (
    <a href={href} className="footer-link">
      {children}
    </a>
  );
}
