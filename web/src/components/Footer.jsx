import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">RENTÓ</div>
            <p className="footer-brand-desc">{t("footer.rentoDesc")}</p>
            <p className="footer-brand-sub">{t("footer.rentoSub")}</p>
            <div className="footer-social">
              <a href="#" aria-label="Instagram" className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" aria-label="Facebook" className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="mailto:info@rento.is" aria-label="Email" className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>{t("footer.rento")}</h4>
            <Link to="/how-it-works" className="footer-link">{t("footer.howItWorks")}</Link>
            <Link to="/calculator" className="footer-link">{t("footer.earn")}</Link>
            <Link to="/faq" className="footer-link">{t("footer.faq")}</Link>
            <a href="mailto:info@rento.is" className="footer-link">{t("footer.contact")}</a>
          </div>

          <div className="footer-col">
            <h4>{t("footer.info")}</h4>
            <Link to="/terms" className="footer-link">{t("footer.terms")}</Link>
            <Link to="/privacy" className="footer-link">{t("footer.privacy")}</Link>
            <Link to="/cookies" className="footer-link">{t("footer.cookies")}</Link>
            <Link to="/banned" className="footer-link">{t("footer.banned")}</Link>
          </div>

          <div className="footer-col">
            <h4>{t("footer.downloadApp")}</h4>
            <p className="footer-app-desc">{t("footer.appDesc")}</p>
            <div className="footer-app-badges">
              <a href="#" className="app-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                App Store
              </a>
              <a href="#" className="app-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m.92-.92l2.09-1.17c.59-.33.59-1.18 0-1.51l-2.09-1.17-2.5 2.5 2.5 2.35M6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z"/></svg>
                Google Play
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-disclaimer">{t("footer.disclaimer")}</p>
          <div className="footer-bottom-row">
            <span>{t("footer.copyright")}</span>
            <span className="footer-bottom-right">
              <span className="trust-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                {t("footer.secure")}
              </span>
              <span className="footer-bottom-sep">·</span>
              <span className="trust-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {t("footer.verified")}
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
