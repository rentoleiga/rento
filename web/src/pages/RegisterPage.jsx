import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../store";
import { useLang } from "../i18n";
import GoogleButton from "../components/GoogleButton";

export default function RegisterPage() {
  const { register, loginGoogle } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    city: "Reykjavík",
    ownerEnabled: true,
    renterEnabled: true,
  });
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
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section">
    <div className="form-card">
      <h1>{t("auth.registerTitle")}</h1>
      <p className="sub">{t("auth.subRegister")}</p>
      {error && <div className="form-error">{error}</div>}
      <GoogleButton label={t("auth.signupGoogle")} />
      <div className="divider">or</div>
      <form onSubmit={submit}>
        <div className="row">
          <div className="field grow">
            <label>{t("auth.first")}</label>
            <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="field grow">
            <label>{t("auth.last")}</label>
            <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>{t("auth.email")}</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>{t("auth.password")} (min 8)</label>
          <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="field">
          <label>{t("auth.city")}</label>
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="field">
          <label className="row" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={form.renterEnabled} onChange={(e) => setForm({ ...form, renterEnabled: e.target.checked })} />
            {t("auth.renter")}
          </label>
          <label className="row" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={form.ownerEnabled} onChange={(e) => setForm({ ...form, ownerEnabled: e.target.checked })} />
            {t("auth.owner")}
          </label>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? t("search.loading") : t("auth.create")}
        </button>
      </form>
      <p className="link-switch">
        {t("auth.haveAccount")}{" "}
        <Link to="/login">{t("nav.login")}</Link>
      </p>
    </div>
    </div>
  );
}