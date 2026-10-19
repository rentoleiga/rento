import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useLang } from "../i18n";

export default function ResetPasswordPage() {
  const { t } = useLang();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState(token ? "checking" : "invalid");
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .get(`/api/auth/reset-password/${encodeURIComponent(token)}`)
      .then((d) => setState(d.valid ? "valid" : "invalid"))
      .catch(() => setState("invalid"));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError(t("auth.passMismatch"));
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/auth/reset-password", {
        token,
        password: form.password,
      });
      setState("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section">
      <div className="form-card">
        <h1>{t("auth.resetTitle")}</h1>
        {error && <div className="form-error">{error}</div>}

        {state === "checking" && <p className="sub">{t("auth.resetChecking")}</p>}

        {state === "invalid" && (
          <>
            <div className="form-error">{t("auth.resetInvalid")}</div>
            <p className="link-switch">
              <Link to="/forgot-password">{t("auth.forgot")}</Link>
            </p>
          </>
        )}

        {state === "done" && (
          <>
            <div className="form-success">{t("auth.resetDone")}</div>
            <p className="link-switch">
              <Link to="/login">{t("auth.backToLogin")}</Link>
            </p>
          </>
        )}

        {state === "valid" && (
          <form onSubmit={submit}>
            <div className="field">
              <label>{t("auth.newPassword")}</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="field">
              <label>{t("auth.confirmPassword")}</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            </div>
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? t("search.loading") : t("auth.resetSubmit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
