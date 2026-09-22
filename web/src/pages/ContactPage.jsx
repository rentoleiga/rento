import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";

export default function ContactPage() {
  const { t } = useLang();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.message.trim()) return;
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="container section">
      <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 32px" }}>
        <h1 style={{ margin: "0 0 10px", fontSize: 32 }}>{t("contact.title")}</h1>
        <p className="muted" style={{ margin: 0, fontSize: 15 }}>Við erum hér til að hjálpa. Sendu okkur línu og við svörum innan 24 klst.</p>
      </div>

      <div className="contact-layout">
        {/* Left info */}
        <div className="contact-info">
          <div className="card contact-info-card">
            <div className="contact-info-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
            <h4>Tölvupóstur</h4>
            <p><a href="mailto:info@rento.is">info@rento.is</a></p>
            <span className="muted small">Svörum innan 24 klst. virka daga</span>
          </div>
          <div className="card contact-info-card">
            <div className="contact-info-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
            <h4>Svartími</h4>
            <p>Virka daga 09–17</p>
            <span className="muted small">Yfirleitt innan nokkurra klst.</span>
          </div>
          <div className="card contact-info-card">
            <div className="contact-info-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <h4>Algengar spurningar</h4>
            <p><Link to="/faq">Skoðaðu FAQ</Link></p>
            <span className="muted small">Flestum spurningum er svarað þar</span>
          </div>
          <div className="card" style={{ padding: 20, background: "#e6f6f0", border: "none" }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>Öruggt og traust</h4>
            <p className="muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>Rentó er stafrænt markaðstorg. Greiðslur fara í gegnum öruggt kerfi og umsagnir hjálpa þér að velja rétt.</p>
          </div>
        </div>

        {/* Right form */}
        <div className="card contact-form-card">
          {sent && <div className="form-success">{t("contact.sent")}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label>{t("contact.name")}</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nafn þitt" />
            </div>
            <div className="field">
              <label>{t("contact.email")} *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="netfang@dæmi.is" />
            </div>
            <div className="field">
              <label>{t("contact.message")} *</label>
              <textarea rows={6} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Hvernig getum við hjálpað?" style={{ width: "100%", resize: "vertical" }} />
            </div>
            <button className="btn btn-primary btn-block" type="submit">{t("contact.send")}</button>
            <p className="muted" style={{ fontSize: 12, marginTop: 12, textAlign: "center" }}>Með því að senda samþykkir þú <Link to="/terms">skilmála</Link> og <Link to="/privacy">persónuverndarstefnu</Link>.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
