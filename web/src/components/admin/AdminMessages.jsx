import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../api";
import { fmt, shortDate, StatusPill, statusLabel } from "./shared";

export default function AdminMessages() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState("new");
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback((s) => {
    const params = new URLSearchParams({ perPage: "30" });
    if (s) params.set("status", s);
    return api.get(`/api/admin/messages?${params}`).then((d) => {
      setRows(d.messages || []);
      setTotal(d.total || 0);
      setUnread(d.unread || 0);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(status); }, [status, load]);

  const answer = async (m) => {
    setBusyId(m.id);
    try {
      await api.patch(`/api/admin/messages/${m.id}/answer`, {});
      await load(status);
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="new">Ósvarað ({unread})</option>
          <option value="answered">Svarað</option>
          <option value="">Allar</option>
        </select>
        <span className="muted">{fmt(total)} meldingar</span>
        {error && <span className="form-error">{error}</span>}
      </div>

      <ul className="plain-list">
        {rows.map((m) => (
          <li key={m.id} style={{ alignItems: "flex-start", flexDirection: "column" }}>
            <div className="row" style={{ width: "100%", justifyContent: "space-between", gap: 10 }}>
              <div>
                <strong>{m.subject || "(án efnis)"}</strong>
                <div className="muted" style={{ fontSize: 13 }}>
                  {m.name ? `${m.name} · ` : ""}{m.email} · {shortDate(m.created_at)}
                </div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <StatusPill status={m.status} label={statusLabel(m.status)} />
                <button className="btn btn-sm" onClick={() => setOpenId(openId === m.id ? null : m.id)}>
                  {openId === m.id ? "Fela" : "Skoða"}
                </button>
                <a className="btn btn-sm btn-outline" href={`mailto:${m.email}?subject=Svar: ${encodeURIComponent(m.subject || "Rentó")}`}>
                  Svara
                </a>
                {m.status === "new" && (
                  <button className="btn btn-sm btn-primary" disabled={busyId === m.id} onClick={() => answer(m)}>
                    Merkja svarað
                  </button>
                )}
              </div>
            </div>
            {openId === m.id && (
              <div className="admin-message-body">
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{m.message}</p>
                <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  IP: {m.ip || "—"}
                  {m.answered_at && ` · svarað ${shortDate(m.answered_at)}${m.answered_by_email ? ` af ${m.answered_by_email}` : ""}`}
                </div>
              </div>
            )}
          </li>
        ))}
        {rows.length === 0 && (
          <li className="muted">Engar meldingar í þessum flokki.</li>
        )}
      </ul>
    </>
  );
}
