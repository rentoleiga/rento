import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { shortDate, fmt } from "./shared";

const stateOf = (r) => {
  if (r.used_at) return ["used", "Used"];
  if (new Date(r.expires_at).getTime() <= Date.now()) return ["expired", "Expired"];
  return ["open", "Open"];
};

export default function AdminPasswordResets() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [links, setLinks] = useState({});

  const load = () => {
    setLoading(true);
    api
      .get("/api/admin/password-resets")
      .then((d) => setRows(d.resets || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const makeLink = async (r) => {
    setBusyId(r.id);
    setError("");
    try {
      const d = await api.post(`/api/admin/password-resets/${r.id}/link`, {});
      setLinks((prev) => ({ ...prev, [r.id]: d.link }));
      if (navigator.clipboard) navigator.clipboard.writeText(d.link).catch(() => {});
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="muted">Loading…</div>;

  return (
    <>
      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
      <p className="muted" style={{ marginTop: 0 }}>
        Password reset requests from the last 30 days. Generate a link and send it to the user by
        email or phone — the link is valid for 60 minutes and can be used once.
      </p>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Requested</th>
              <th>Emailed</th>
              <th>Expires</th>
              <th>State</th>
              <th>Reset link</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const [state, label] = stateOf(r);
              return (
                <tr key={r.id}>
                  <td>
                    <Link to={`/users/${r.user_id}`}>{r.email}</Link>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {[r.first_name, r.last_name].filter(Boolean).join(" ") || `user #${r.user_id}`}
                    </div>
                  </td>
                  <td className="muted">{shortDate(r.created_at)}</td>
                  <td className="muted">{r.emailed_at ? shortDate(r.emailed_at) : "—"}</td>
                  <td className="muted">{shortDate(r.expires_at)}</td>
                  <td>
                    <span className={`pill ${state === "open" ? "pill-ok" : state === "used" ? "" : "pill-warn"}`}>
                      {label}
                    </span>
                  </td>
                  <td>
                    {links[r.id] ? (
                      <input
                        readOnly
                        value={links[r.id]}
                        onFocus={(e) => e.target.select()}
                        style={{ width: 320, fontFamily: "monospace", fontSize: 12 }}
                      />
                    ) : (
                      <button
                        className="btn btn-sm btn-outline"
                        disabled={busyId === r.id}
                        onClick={() => makeLink(r)}
                      >
                        {busyId === r.id ? "…" : "Generate link"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">No reset requests in the last 30 days.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ fontSize: 12 }}>
        {fmt(rows.length)} requests
      </p>
    </>
  );
}
