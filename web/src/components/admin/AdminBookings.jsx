import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { fmt, fmtIsk, shortDate, StatusPill, statusLabel } from "./shared";

export default function AdminBookings() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback((p, s) => {
    const params = new URLSearchParams({ page: String(p), perPage: "25" });
    if (s) params.set("status", s);
    return api.get(`/api/admin/bookings?${params}`).then((d) => {
      setRows(d.bookings || []);
      setTotal(d.total || 0);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const h = setTimeout(() => { setPage(1); load(1, status); }, 300);
    return () => clearTimeout(h);
  }, [status, load]);

  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <>
      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Allar stöður</option>
          <option value="pending">Bið</option>
          <option value="approved">Samþykkt</option>
          <option value="payment_pending">Greiðslu í bið</option>
          <option value="active">Virkt</option>
          <option value="returned">Skilað</option>
          <option value="completed">Lokið</option>
          <option value="cancelled">Afbókað</option>
          <option value="rejected">Hafnað</option>
        </select>
        <span className="muted">{fmt(total)} bókanir</span>
        {error && <span className="form-error">{error}</span>}
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Auglýsing</th>
              <th>Leigjandi</th>
              <th>Eigandi</th>
              <th>Staða</th>
              <th>Greiðsla</th>
              <th>Upphaf</th>
              <th>Skráð</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td className="muted">{b.id}</td>
                <td>{b.listing_title || <span className="muted">—</span>}</td>
                <td>{b.renter_email ? <Link to={`/users/${b.renter_id}`}>{b.renter_email}</Link> : <span className="muted">—</span>}</td>
                <td>{b.owner_email ? <Link to={`/users/${b.owner_id}`}>{b.owner_email}</Link> : <span className="muted">—</span>}</td>
                <td><StatusPill status={b.status} label={statusLabel(b.status)} /></td>
                <td>
                  <StatusPill status={b.payment_status} label={statusLabel(b.payment_status)} />
                  <div className="muted" style={{ fontSize: 12 }}>{fmtIsk(b.total)} {b.currency}</div>
                </td>
                <td className="muted">{shortDate(b.start_time)}</td>
                <td className="muted">{shortDate(b.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="muted">Engar bókanir fundust.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 25 && (
        <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: "center" }}>
          <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p, status); }}>← Fyrri</button>
          <span className="muted">Síða {page} / {pages}</span>
          <button className="btn btn-sm btn-outline" disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); load(p, status); }}>Næsta →</button>
        </div>
      )}
    </>
  );
}
