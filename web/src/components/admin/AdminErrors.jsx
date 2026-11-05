import React, { useCallback, useEffect, useState } from "react";
import { api } from "../../api";
import { fmt, shortDate } from "./shared";

export default function AdminErrors() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback((s) => {
    const params = new URLSearchParams({ perPage: "50" });
    if (s) params.set("source", s);
    return api
      .get(`/api/admin/errors?${params}`)
      .then((d) => {
        setRows(d.errors || []);
        setTotal(d.total || 0);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load(source);
  }, [source, load]);

  const remove = async (id) => {
    setBusy(true);
    try {
      await api.del(`/api/admin/errors/${id}`);
      await load(source);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Delete all error logs?")) return;
    setBusy(true);
    try {
      await api.del("/api/admin/errors");
      await load(source);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <select className="admin-select" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">All sources</option>
          <option value="frontend">Frontend</option>
          <option value="backend">Backend</option>
        </select>
        <span className="muted">{fmt(total)} entries</span>
        <button className="btn btn-outline btn-sm" disabled={busy || !rows.length} onClick={clearAll}>
          Clear all
        </button>
        {error && <span className="form-error">{error}</span>}
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Source</th>
              <th>Message</th>
              <th>URL</th>
              <th>User</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <React.Fragment key={r.id}>
                <tr>
                  <td className="muted">{shortDate(r.created_at)}</td>
                  <td>
                    <span className={`pill ${r.source === "backend" ? "pill-danger" : "pill-warn"}`}>{r.source}</span>
                  </td>
                  <td>
                    <button className="linklike" onClick={() => setOpen(open === r.id ? null : r.id)}>
                      {String(r.message).slice(0, 120)}
                      {String(r.message).length > 120 ? "…" : ""}
                    </button>
                  </td>
                  <td className="muted" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.url || "—"}
                  </td>
                  <td className="muted">{r.user_id || "—"}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" disabled={busy} onClick={() => remove(r.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
                {open === r.id && (
                  <tr>
                    <td colSpan={6} style={{ background: "#f7f9f8" }}>
                      <div style={{ fontSize: 12 }}>
                        {r.ip && <div className="muted">IP: {r.ip}</div>}
                        {r.user_agent && <div className="muted">UA: {r.user_agent}</div>}
                        {r.stack && (
                          <pre style={{ whiteSpace: "pre-wrap", margin: "8px 0 0", fontSize: 12 }}>
                            {r.stack}
                          </pre>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="muted" style={{ textAlign: "center", padding: 20 }}>
                  No errors logged.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
