import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";

const KEY = "rento_cookie_consent";

function readConsent() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const { t } = useLang();
  const [consent, setConsent] = useState(() => readConsent());
  const [open, setOpen] = useState(false);
  const [other, setOther] = useState(() => !!readConsent()?.other);

  useEffect(() => {
    const handler = () => {
      setOther(!!readConsent()?.other);
      setOpen(true);
    };
    window.addEventListener("rento:cookie-settings", handler);
    return () => window.removeEventListener("rento:cookie-settings", handler);
  }, []);

  const save = (otherValue) => {
    const next = { necessary: true, other: !!otherValue, ts: Date.now() };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setConsent(next);
    setOther(!!otherValue);
    setOpen(false);
  };

  const showBanner = !consent && !open;

  return (
    <>
      {showBanner && (
        <div className="cookie-banner" role="dialog" aria-live="polite" aria-label={t("cookie.settings.title")}>
          <div className="cookie-banner-inner">
            <p>
              {t("cookie.banner.text")}{" "}
              <Link to="/cookies">{t("cookie.banner.more")}</Link>
            </p>
            <div className="cookie-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>
                {t("cookie.banner.settings")}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => save(true)}>
                {t("cookie.banner.accept")}
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="cookie-overlay" onClick={() => setOpen(false)}>
          <div
            className="cookie-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t("cookie.settings.title")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cookie-modal-head">
              <h3>{t("cookie.settings.title")}</h3>
              <button className="cookie-close" onClick={() => setOpen(false)} aria-label="Loka">
                ×
              </button>
            </div>
            <p className="muted" style={{ marginTop: 0 }}>{t("cookie.settings.text")}</p>

            <div className="cookie-cat">
              <div className="cookie-cat-text">
                <strong>{t("cookie.necessary.title")}</strong>
                <p className="muted">{t("cookie.necessary.text")}</p>
              </div>
              <label className="cookie-switch">
                <input type="checkbox" checked disabled />
                <span className="cookie-locked">{t("cookie.always")}</span>
              </label>
            </div>

            <div className="cookie-cat">
              <div className="cookie-cat-text">
                <strong>{t("cookie.other.title")}</strong>
                <p className="muted">{t("cookie.other.text")}</p>
              </div>
              <label className="cookie-switch">
                <input type="checkbox" checked={other} onChange={(e) => setOther(e.target.checked)} />
              </label>
            </div>

            <div className="cookie-actions cookie-actions-end">
              <button className="btn btn-outline btn-sm" onClick={() => save(false)}>
                {t("cookie.onlyNecessary")}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => save(other)}>
                {t("cookie.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
