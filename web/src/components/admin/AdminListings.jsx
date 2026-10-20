import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { fmt, fmtIsk, shortDate, StatusPill, statusLabel, tierLabel } from "./shared";

export default function AdminListings() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback((p, keyword, s) => {
    const params = new URLSearchParams({ page: String(p), perPage: "25" });
    if (keyword) params.set("q", keyword);
    if (s) params.set("status", s);
    return api.get(`/api/admin/listings?${params}`).then((d) => {
      setRows(d.listings || []);
      setTotal(d.total || 0);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const h = setTimeout(() => { setPage(1); load(1, q, status); }, 350);
    return () => clearTimeout(h);
  }, [q, status, load]);

  const run = async (fn, id) => {
    setBusyId(id);
    try {
      await fn();
      await load(page, q, status);
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const setStatusFor = (l, next) =>
    run(() => api.patch(`/api/admin/listings/${l.id}/status`, { status: next }), l.id);

  const remove = (l) => {
    if (!window.confirm(`Delete the listing "${l.title}"? It will disappear from search.`)) return;
    run(() => api.del(`/api/admin/listings/${l.id}`), l.id);
  };

  const action = (l, act) =>
    run(() => api.post(`/api/admin/listings/${l.id}/action`, { action: act, days: 30 }), l.id);

  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <>
      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          className="admin-search"
          placeholder="Search titles and owners…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="paused">Paused</option>
          <option value="suspended">Suspended</option>
          <option value="deleted">Deleted</option>
        </select>
        <span className="muted">{fmt(total)} results</span>
        {error && <span className="form-error">{error}</span>}
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Listing</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Boost</th>
              <th>Price</th>
              <th>Views</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id}>
                <td>
                  <Link to={`/listing/${l.slug}`} className="admin-user">{l.title}</Link>
                  <div className="muted" style={{ fontSize: 12 }}>#{l.id} · {shortDate(l.created_at)}</div>
                </td>
                <td>
                  {l.owner_email ? <Link to={`/users/${l.owner_id}`}>{l.owner_email}</Link> : <span className="muted">—</span>}
                  {(l.owner_first || l.owner_last) && (
                    <div className="muted" style={{ fontSize: 12 }}>{`${l.owner_first || ""} ${l.owner_last || ""}`.trim()}</div>
                  )}
                </td>
                <td><StatusPill status={l.status} label={statusLabel(l.status)} /></td>
                <td>
                  {l.promotion_tier && l.promotion_tier !== "none" ? (
                    <>
                      <span className={`badge badge-tier badge-${l.promotion_tier === "featured" ? "silver" : l.promotion_tier}`}>
                        {tierLabel(l.promotion_tier)}
                      </span>
                      <div className="muted" style={{ fontSize: 12 }}>{l.promotion_until ? shortDate(l.promotion_until) : "—"}</div>
                    </>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  {l.price_daily ? `${fmtIsk(l.price_daily)}/day` : l.price_hourly ? `${fmtIsk(l.price_hourly)}/hr` : "—"}
                </td>
                <td>{fmt(l.view_count)}</td>
                <td>
                  <div className="admin-row-actions">
                    {l.status !== "published" && l.status !== "deleted" && (
                      <button className="btn btn-sm btn-outline" disabled={busyId === l.id} onClick={() => setStatusFor(l, "published")}>Publish</button>
                    )}
                    {l.status === "published" && (
                      <button className="btn btn-sm btn-outline" disabled={busyId === l.id} onClick={() => setStatusFor(l, "suspended")}>Suspend</button>
                    )}
                    {l.status !== "deleted" && (
                      <button className="btn btn-sm btn-outline" disabled={busyId === l.id} onClick={() => action(l, "extend")}>+30d</button>
                    )}
                    {l.status === "published" && (
                      <button className="btn btn-sm btn-outline" disabled={busyId === l.id} onClick={() => action(l, "expire")}>Expire</button>
                    )}
                    {l.status !== "deleted" && (
                      <button className="btn btn-sm btn-danger" disabled={busyId === l.id} onClick={() => remove(l)}>Delete</button>
                    )}
                    {l.status === "deleted" && <span className="muted">deleted</span>}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="muted">No listings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 25 && (
        <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: "center" }}>
          <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p, q, status); }}>← Prev</button>
          <span className="muted">Page {page} / {pages}</span>
          <button className="btn btn-sm btn-outline" disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); load(p, q, status); }}>Next →</button>
        </div>
      )}
    </>
  );
}
