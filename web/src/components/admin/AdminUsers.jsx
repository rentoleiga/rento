import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../store";
import { fmt, shortDate } from "./shared";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback((p, keyword, r) => {
    const params = new URLSearchParams({ page: String(p), perPage: "25" });
    if (keyword) params.set("q", keyword);
    if (r) params.set("role", r);
    return api.get(`/api/admin/users?${params}`).then((d) => {
      setRows(d.users || []);
      setTotal(d.total || 0);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const h = setTimeout(() => { setPage(1); load(1, q, role); }, 350);
    return () => clearTimeout(h);
  }, [q, role, load]);

  const patch = async (path, body) => {
    try {
      await api.patch(path, body);
      await load(page, q, role);
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = (u) => {
    const next = u.role === "admin" ? "user" : "admin";
    if (!window.confirm(`Change the role of ${u.email} from "${u.role}" to "${next}"?`)) return;
    setBusyId(u.id);
    patch(`/api/admin/users/${u.id}/role`, { role: next });
  };

  const setBanned = (u, banned) => {
    if (banned) {
      const reason = window.prompt(`Reason for suspending ${u.email}:`, "") || "";
      setBusyId(u.id);
      patch(`/api/admin/users/${u.id}/ban`, { reason });
    } else {
      if (!window.confirm(`Reinstate ${u.email}?`)) return;
      setBusyId(u.id);
      patch(`/api/admin/users/${u.id}/unban`, {});
    }
  };

  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <>
      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          className="admin-search"
          placeholder="Search emails, names, cities…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="admin-select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All</option>
          <option value="user">Users</option>
          <option value="admin">Administrators</option>
        </select>
        <span className="muted">{fmt(total)} results</span>
        {error && <span className="form-error">{error}</span>}
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Credits</th>
              <th>Slots</th>
              <th>Listings</th>
              <th>Bookings</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link to={`/users/${u.id}`} className="admin-user">
                    {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.email}
                  </Link>
                  <div className="muted" style={{ fontSize: 12 }}>{u.email}{u.city ? ` · ${u.city}` : ""}</div>
                  {(u.email_verified || u.identity_verified || u.business_verified || u.listing_verified) && (
                    <div className="admin-flags">
                      {u.email_verified && <span className="flag flag-ok">email</span>}
                      {u.identity_verified && <span className="flag flag-ok">identity</span>}
                      {u.business_verified && <span className="flag flag-ok">business</span>}
                      {u.listing_verified && <span className="flag flag-ok">listing</span>}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`pill ${u.role === "admin" ? "pill-admin" : ""}`}>
                    {u.role === "admin" ? "Admin" : "User"}
                  </span>
                  {u.banned_at && (
                    <div style={{ marginTop: 4 }}>
                      <span className="pill pill-danger">Suspended</span>
                      {u.banned_reason && <div className="muted" style={{ fontSize: 12 }}>{u.banned_reason}</div>}
                    </div>
                  )}
                </td>
                <td>{fmt(u.credit_balance)}</td>
                <td>{fmt(u.extra_slots)}</td>
                <td>{fmt(u.listings)}</td>
                <td>{fmt(u.bookings)}</td>
                <td className="muted">{shortDate(u.created_at)}</td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      className="btn btn-sm btn-outline"
                      disabled={busyId === u.id || u.id === me?.id}
                      onClick={() => changeRole(u)}
                    >
                      {u.role === "admin" ? "Demote" : "Make admin"}
                    </button>
                    <button
                      className={`btn btn-sm ${u.banned_at ? "btn-outline" : "btn-danger"}`}
                      disabled={busyId === u.id || u.id === me?.id}
                      onClick={() => setBanned(u, !u.banned_at)}
                    >
                      {u.banned_at ? "Reinstate" : "Suspend"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="muted">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 25 && (
        <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: "center" }}>
          <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p, q, role); }}>← Prev</button>
          <span className="muted">Page {page} / {pages}</span>
          <button className="btn btn-sm btn-outline" disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); load(p, q, role); }}>Next →</button>
        </div>
      )}
    </>
  );
}
