import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../store";
import { useLang } from "../i18n";
import GoogleButton from "../components/GoogleButton";

export default function LoginPage() {
  const { login, loginGoogle } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: "demo.renter@rento.is", password: "password123" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = params.get("google_token");
    const gErr = params.get("google_error");
    if (token) {
      loginGoogle(token)
        .then(() => navigate(params.get("next") || "/dashboard"))
        .catch((e) => setError(e.message));
    } else if (gErr) {
      setError(gErr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate(params.get("next") || "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-card">
      <h1>{t("auth.welcome")}</h1>
      <p className="sub">{t("auth.subLogin")}</p>
      {error && <div className="form-error">{error}</div>}
      <GoogleButton />
      <div className="divider">or</div>
      <form onSubmit={submit}>
        <div className="field">
          <label>{t("auth.email")}</label>
          <input type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>{t("auth.password")}</label>
          <input type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? t("search.loading") : t("auth.login")}
        </button>
      </form>
      <p className="link-switch">
        {t("auth.noAccount")}{" "}
        <Link to="/register">{t("nav.register")}</Link>
      </p>
      <p className="muted" style={{ textAlign: "center", fontSize: 13, marginTop: 12 }}>
        {t("auth.demo")}
      </p>
    </div>
  );
}