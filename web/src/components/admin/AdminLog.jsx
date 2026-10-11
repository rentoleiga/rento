import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { fmt, shortDate, actionLabel } from "./shared";

export default function AdminLog() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  const load = useCallback((f) => {
    const params = new URLSearchParams({ perPage: "30" });
    if (f) params.set("action", f);
    return api.get(`/api/admin/actions?${params}`).then((d) => {
      setRows(d.actions || []);
      setTotal(d.total || 0);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  return (
    <>
      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <select className="admin-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All types</option>
          <option value="user.">Users</option>
          <option value="listing.">Listings</option>
          <option value="credit.">Credit</option>
          <option value="contact.">Contact</option>
        </select>
        <span className="muted">{fmt(total)} entries</span>
        {error && <span className="form-error">{error}</span>}
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="muted">{shortDate(a.created_at)}</td>
                <td>
                  {a.admin_id ? (a.admin_email || a.admin_id) : <span className="muted">system</span>}
                  {(a.admin_first || a.admin_last) && (
                    <div className="muted" style={{ fontSize: 12 }}>{`${a.admin_first || ""} ${a.admin_last || ""}`.trim()}</div>
                  )}
                </td>
                <td>
                  <strong>{actionLabel(a.action)}</strong>
                  <div className="muted" style={{ fontSize: 12 }}>{a.action}</div>
                </td>
                <td>
                  {a.target_type === "user" && a.target_id ? (
                    <Link to={`/users/${a.target_id}`}>user #{a.target_id}</Link>
                  ) : a.target_type ? (
                    `${a.target_type} #${a.target_id}`
                  ) : (
                    "—"
                  )}
                  {a.data ? <div className="muted" style={{ fontSize: 12 }}>{JSON.stringify(a.data)}</div> : null}
                </td>
                <td className="muted">{a.ip || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="muted">No entries yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
