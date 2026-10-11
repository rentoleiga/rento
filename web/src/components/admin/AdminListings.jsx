import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { fmt, fmtIsk, shortDate, StatusPill, statusLabel } from "./shared";

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

  const run = async (fn) => {
    setBusyId(fn.id);
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
    run(() => api.patch(`/api/admin/listings/${l.id}/status`, { status: next }));

  const remove = (l) => {
    if (!window.confirm(`Eyða auglýsingunni "${l.title}"? Hún hverfur úr leit.`)) return;
    run(() => api.del(`/api/admin/listings/${l.id}`));
  };

  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <>
      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          className="admin-search"
          placeholder="Leita í titlum og eigendum…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Allar stöður</option>
          <option value="published">Birtar</option>
          <option value="draft">Uppdrættir</option>
          <option value="paused">Í pásu</option>
          <option value="suspended">Geymdar</option>
          <option value="deleted">Eyddar</option>
        </select>
        <span className="muted">{fmt(total)} niðurstöður</span>
        {error && <span className="form-error">{error}</span>}
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Auglýsing</th>
              <th>Eigandi</th>
              <th>Staða</th>
              <th>Kynning</th>
              <th>Verð</th>
              <th>Skoð.</th>
              <th>Aðgerðir</th>
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
                        {l.promotion_tier}
                      </span>
                      <div className="muted" style={{ fontSize: 12 }}>{l.promotion_until ? shortDate(l.promotion_until) : "—"}</div>
                    </>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  {l.price_daily ? `${fmtIsk(l.price_daily)}/dag` : l.price_hourly ? `${fmtIsk(l.price_hourly)}/klst` : "—"}
                </td>
                <td>{fmt(l.view_count)}</td>
                <td>
                  <div className="admin-row-actions">
                    {l.status !== "published" && l.status !== "deleted" && (
                      <button className="btn btn-sm btn-outline" disabled={busyId === l.id} onClick={() => setStatusFor(l, "published")}>Birta</button>
                    )}
                    {l.status === "published" && (
                      <button className="btn btn-sm btn-outline" disabled={busyId === l.id} onClick={() => setStatusFor(l, "suspended")}>Geyma</button>
                    )}
                    {l.status !== "deleted" && (
                      <button className="btn btn-sm btn-danger" disabled={busyId === l.id} onClick={() => remove(l)}>Eyða</button>
                    )}
                    {l.status === "deleted" && <span className="muted">eydd</span>}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="muted">Engar auglýsingar fundust.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 25 && (
        <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: "center" }}>
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p, q, status); }}>← Fyrri</button>
          <span className="muted">Síða {page} / {pages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); load(p, q, status); }}>Næsta →</button>
        </div>
      )}
    </>
  );
}
