import React, { useEffect, useState } from "react";
import { api } from "../../api";

const PAGES = [
  { key: "faq_is", label: "FAQ (Algengar spurningar)" },
  { key: "terms_is", label: "Terms (Notendaskilmálar)" },
  { key: "privacy_is", label: "Privacy (Persónuvernd)" },
];

export default function AdminContent() {
  const [values, setValues] = useState({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/admin/settings")
      .then((d) => {
        const map = {};
        (d.settings || []).forEach((s) => { map[s.key] = s.value || ""; });
        setValues(map);
      })
      .catch((e) => setError(e.message));
  }, []);

  const save = async (key) => {
    setNotice("");
    setError("");
    try {
      await api.put(`/api/admin/settings/${key}`, { value: values[key] || "" });
      setNotice(`${key} saved.`);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
      {notice && <div className="form-success" style={{ marginBottom: 12 }}>{notice}</div>}
      <div className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 17, marginTop: 0 }}>Public content</h2>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
          Leave a page empty to use the built-in text. Formatting: start a line with <code>## </code> for a heading and
          separate paragraphs with a blank line.
        </p>
        {PAGES.map((p) => (
          <div key={p.key} className="field">
            <label>{p.label}</label>
            <textarea
              rows={8}
              value={values[p.key] || ""}
              onChange={(e) => setValues({ ...values, [p.key]: e.target.value })}
              style={{ width: "100%", resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
            />
            <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
              <span className="muted" style={{ fontSize: 12 }}>
                {(values[p.key] || "").length} chars
              </span>
              <button className="btn btn-outline btn-sm" onClick={() => save(p.key)}>Save</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
