import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useLang } from "../i18n";

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section">
      <div className="form-card">
        <h1>{t("auth.forgotTitle")}</h1>
        <p className="sub">{t("auth.forgotSub")}</p>
        {error && <div className="form-error">{error}</div>}
        {sent ? (
          <>
            <div className="form-success">{t("auth.forgotSent")}</div>
            <p className="link-switch">
              <Link to="/login">{t("auth.backToLogin")}</Link>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={submit}>
              <div className="field">
                <label>{t("auth.email")}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button className="btn btn-primary btn-block" disabled={busy}>
                {busy ? t("search.loading") : t("auth.forgotSend")}
              </button>
            </form>
            <p className="link-switch">
              <Link to="/login">{t("auth.backToLogin")}</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
