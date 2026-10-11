import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { fmt, fmtIsk, shortDate, StatusPill, statusLabel } from "./shared";

export default function AdminBookings() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = useCallback((p, s, keyword) => {
    const params = new URLSearchParams({ page: String(p), perPage: "25" });
    if (s) params.set("status", s);
    if (keyword) params.set("q", keyword);
    return api.get(`/api/admin/bookings?${params}`).then((d) => {
      setRows(d.bookings || []);
      setTotal(d.total || 0);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const h = setTimeout(() => { setPage(1); load(1, status, q); }, 350);
    return () => clearTimeout(h);
  }, [status, q, load]);

  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <>
      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          className="admin-search"
          placeholder="Search by listing or user email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="muted">{fmt(total)} results</span>
        {error && <span className="form-error">{error}</span>}
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Listing</th>
              <th>Renter</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Starts</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>#{b.id}</td>
                <td>
                  {b.listing_id ? (
                    <Link to={`/listing/${b.slug || b.listing_id}`} className="admin-user">
                      {b.listing_title || `listing #${b.listing_id}`}
                    </Link>
                  ) : <span className="muted">—</span>}
                </td>
                <td>
                  <Link to={`/users/${b.renter_id}`}>{b.renter_email}</Link>
                  {(b.renter_first || b.renter_last) && (
                    <div className="muted" style={{ fontSize: 12 }}>{`${b.renter_first || ""} ${b.renter_last || ""}`.trim()}</div>
                  )}
                </td>
                <td>
                  {b.owner_id ? <Link to={`/users/${b.owner_id}`}>{b.owner_email}</Link> : <span className="muted">—</span>}
                </td>
                <td><StatusPill status={b.status} label={statusLabel(b.status)} /></td>
                <td>
                  <StatusPill status={b.payment_status} label={statusLabel(b.payment_status)} />
                  <div className="muted" style={{ fontSize: 12 }}>
                    {b.total_price ? fmtIsk(b.total_price) : "—"} · {b.payment_method || "—"}
                  </div>
                </td>
                <td className="muted">{shortDate(b.start_date)}</td>
                <td className="muted">{shortDate(b.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="muted">No bookings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 25 && (
        <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: "center" }}>
          <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p, status, q); }}>← Prev</button>
          <span className="muted">Page {page} / {pages}</span>
          <button className="btn btn-sm btn-outline" disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); load(p, status, q); }}>Next →</button>
        </div>
      )}
    </>
  );
}
