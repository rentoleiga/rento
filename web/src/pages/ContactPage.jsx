import React, { useState } from "react";
import { useLang } from "../i18n";

export default function ContactPage() {
  const { t } = useLang();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.message.trim()) return;
    setSent(true);
    // In real app, POST to /api/contact
    setTimeout(() => setSent(false), 4000);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="container section">
      <div className="form-card wide" style={{ maxWidth: 640 }}>
        <h1 style={{ marginTop: 0, color: "var(--primary)", fontSize: 28 }}>{t("contact.title")}</h1>
        {sent && <div className="form-success">{t("contact.sent")}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>{t("contact.name")}</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("contact.name")} />
          </div>
          <div className="field">
            <label>{t("contact.email")} *</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("contact.email")} />
          </div>
          <div className="field">
            <label>{t("contact.message")} *</label>
            <textarea rows={6} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={t("contact.message")} style={{ width: "100%", resize: "vertical" }} />
          </div>
          <button className="btn btn-primary" type="submit" style={{ float: "right" }}>{t("contact.send")}</button>
        </form>
      </div>
    </div>
  );
}
