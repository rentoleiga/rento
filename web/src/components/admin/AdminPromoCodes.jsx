import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { shortDate } from "./shared";

const EMPTY = { code: "", kind: "any", percent: "", amount: "", maxUses: "", expiresAt: "" };

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = () =>
    api.get("/api/admin/promo-codes")
      .then((d) => setCodes(d.codes || []))
      .catch((e) => setError(e.message));

  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      await api.post("/api/admin/promo-codes", form);
      setNotice(`Code ${form.code.toUpperCase()} created.`);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = async (c) => {
    try {
      await api.put(`/api/admin/promo-codes/${c.id}`, { active: !c.active });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete code ${c.code}?`)) return;
    try {
      await api.del(`/api/admin/promo-codes/${c.id}`);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
      {notice && <div className="form-success" style={{ marginBottom: 12 }}>{notice}</div>}

      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, marginTop: 0 }}>New promo code</h2>
        <form onSubmit={create} className="row" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Code</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER10" required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Applies to</label>
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="any">Everything</option>
              <option value="slot">Slots</option>
              <option value="promotion">Promotions</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Percent off</label>
            <input type="number" min="0" max="100" value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} placeholder="10" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>or amount (kr.)</label>
            <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="500" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Max uses</label>
            <input type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="∞" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Expires</label>
            <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit">Create</button>
        </form>
        <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
          Set a percentage OR a fixed amount. Codes are case-insensitive.
        </p>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 17, marginTop: 0 }}>Promo codes</h2>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Kind</th>
                <th>Discount</th>
                <th>Uses</th>
                <th>Expires</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.code}</strong></td>
                  <td>{c.kind}</td>
                  <td>{c.percent ? `${c.percent}%` : `${c.amount} kr.`}</td>
                  <td>{c.uses}{c.max_uses != null ? ` / ${c.max_uses}` : ""}</td>
                  <td className="muted">{c.expires_at ? shortDate(c.expires_at) : "—"}</td>
                  <td>{c.active ? "Yes" : "No"}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => toggle(c)}>
                        {c.active ? "Disable" : "Enable"}
                      </button>
                      <button className="btn btn-sm btn-outline" onClick={() => remove(c)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {codes.length === 0 && <tr><td colSpan={7} className="muted">No promo codes yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
