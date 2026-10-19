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
            <div className="footer-logo"><img src="/rento-logo.png" alt="RentÃ³" style={{ height: 36, width: "auto" }} /></div>
            <p className="footer-brand-desc">{t("footer.rentoDesc")}</p>
          </div>

          <div className="footer-col">
            <h4>{t("footer.rento")}</h4>
            <Link to="/how-it-works" className="footer-link">{t("footer.howItWorks")}</Link>
            <Link to="/calculator" className="footer-link">{t("footer.earn")}</Link>
            <Link to="/faq" className="footer-link">{t("footer.faq")}</Link>
            <Link to="/contact" className="footer-link">{t("footer.contact")}</Link>
            <Link to="/promote" className="footer-link">Auglýsingapláss</Link>
          </div>

          <div className="footer-col">
            <h4>{t("footer.info")}</h4>
            <Link to="/terms" className="footer-link">{t("footer.terms")}</Link>
            <Link to="/privacy" className="footer-link">{t("footer.privacy")}</Link>
            <Link to="/cookies" className="footer-link">{t("footer.cookies")}</Link>
            <button
              type="button"
              className="footer-link footer-link-btn"
              onClick={() => window.dispatchEvent(new Event("rento:cookie-settings"))}
            >
              {t("cookie.footer")}
            </button>
            <Link to="/banned" className="footer-link">{t("footer.banned")}</Link>
          </div>

          <div className="footer-col footer-side">
            <div className="footer-box">
              <h4>{t("footer.followUs")}</h4>
              <div className="footer-social">
                <a href="https://www.instagram.com/rento.is" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="https://www.facebook.com/rento.is" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="mailto:info@rento.is" aria-label="Email" className="social-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </a>
              </div>
            </div>
          </div>


        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-row">
            <span>{t("footer.copyright")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
