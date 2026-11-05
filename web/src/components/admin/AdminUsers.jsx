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
  const [freeSlots, setFreeSlots] = useState(3);

  const load = useCallback((p, keyword, r) => {
    const params = new URLSearchParams({ page: String(p), perPage: "25" });
    if (keyword) params.set("q", keyword);
    if (r) params.set("role", r);
    return api.get(`/api/admin/users?${params}`).then((d) => {
      setRows(d.users || []);
      setTotal(d.total || 0);
      if (d.freeSlots != null) setFreeSlots(d.freeSlots);
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

  const grantSlots = async (u) => {
    const raw = window.prompt(`How many extra ad slots should ${u.email} get?`, "1");
    if (raw === null) return;
    const count = parseInt(raw, 10);
    if (!Number.isFinite(count) || count < 1 || count > 20) {
      window.alert("Enter a number between 1 and 20.");
      return;
    }
    setBusyId(u.id);
    try {
      await api.post(`/api/admin/users/${u.id}/slots`, { count });
      await load(page, q, role);
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const revokeSlot = async (u) => {
    if (!u.granted_slot_id) return;
    if (!window.confirm(`Remove one unused granted ad slot from ${u.email}?`)) return;
    setBusyId(u.id);
    try {
      await api.del(`/api/admin/users/${u.id}/slots/${u.granted_slot_id}`);
      await load(page, q, role);
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusyId(null);
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
                <td>
                  <div title="Published listings / total ad capacity">
                    {fmt(u.active_listings)} / {fmt(freeSlots + (u.available_slots || 0))}
                  </div>
                  <div className="muted" style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
                    {u.available_slots > 0 ? `+${fmt(u.available_slots)} extra` : "3 free"}
                    {u.granted_slots > 0 && (
                      <button
                        className="btn btn-sm btn-outline"
                        style={{ padding: "0 6px", lineHeight: 1.4 }}
                        disabled={busyId === u.id}
                        onClick={() => revokeSlot(u)}
                        title="Remove one unused granted slot"
                      >
                        −
                      </button>
                    )}
                  </div>
                </td>
                <td>{fmt(u.listings)}</td>
                <td>{fmt(u.bookings)}</td>
                <td className="muted">{shortDate(u.created_at)}</td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      className="btn btn-sm btn-outline"
                      disabled={busyId === u.id}
                      onClick={() => grantSlots(u)}
                    >
                      + Ad slot
                    </button>
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
