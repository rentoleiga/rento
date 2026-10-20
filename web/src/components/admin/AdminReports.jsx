import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { shortDate, StatusPill, statusLabel } from "./shared";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [dups, setDups] = useState([]);
  const [status, setStatus] = useState("open");
  const [error, setError] = useState("");

  const loadReports = () =>
    api.get(`/api/admin/reports?status=${status}`)
      .then((d) => setReports(d.reports || []))
      .catch((e) => setError(e.message));

  useEffect(loadReports, [status]);
  useEffect(() => {
    api.get("/api/admin/search-analytics").then(setAnalytics).catch(() => {});
    api.get("/api/admin/listings/duplicates").then((d) => setDups(d.groups || [])).catch(() => {});
  }, []);

  const setReportStatus = async (id, next) => {
    try {
      await api.put(`/api/admin/reports/${id}`, { status: next });
      loadReports();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ fontSize: 17, margin: 0 }}>Reports</h2>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="">All</option>
          </select>
        </div>
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Reporter</th>
                <th>Target</th>
                <th>Reason</th>
                <th>Details</th>
                <th>Status</th>
                <th>Time</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.reporter_email || "—"}</td>
                  <td>
                    {r.target_type === "listing" ? (
                      <Link to={`/listing/${r.target_id}`}>{r.listing_title || `Listing #${r.target_id}`}</Link>
                    ) : r.target_type === "user" ? (
                      <Link to={`/users/${r.target_id}`}>{r.target_email || `User #${r.target_id}`}</Link>
                    ) : (
                      `Message #${r.target_id}`
                    )}
                  </td>
                  <td>{r.reason}</td>
                  <td className="muted" style={{ maxWidth: 260, whiteSpace: "pre-wrap" }}>{r.details || "—"}</td>
                  <td><StatusPill status={r.status} label={statusLabel(r.status)} /></td>
                  <td className="muted">{shortDate(r.created_at)}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      {r.status === "open" && (
                        <>
                          <button className="btn btn-sm btn-outline" onClick={() => setReportStatus(r.id, "resolved")}>Resolve</button>
                          <button className="btn btn-sm btn-outline" onClick={() => setReportStatus(r.id, "dismissed")}>Dismiss</button>
                        </>
                      )}
                      {r.status !== "open" && (
                        <button className="btn btn-sm btn-outline" onClick={() => setReportStatus(r.id, "open")}>Reopen</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={8} className="muted">No reports.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, marginTop: 0 }}>Search analytics · last 30 days</h2>
        {!analytics ? <div className="muted">Loading…</div> : (
          <>
            <div className="dash-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
              <div className="stat-card">
                <div className="stat-num">{analytics.totals.searches}</div>
                <div className="stat-label">Searches</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{analytics.totals.zero_results}</div>
                <div className="stat-label">Zero results</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">
                  {analytics.totals.searches
                    ? `${Math.round((analytics.totals.zero_results / analytics.totals.searches) * 100)}%`
                    : "0%"}
                </div>
                <div className="stat-label">Empty rate</div>
              </div>
            </div>
            <div className="row" style={{ alignItems: "flex-start", gap: 24, marginTop: 14 }}>
              <div className="grow">
                <h3 style={{ fontSize: 14 }}>Top searches</h3>
                <ul className="plain-list">
                  {analytics.top.map((t) => (
                    <li key={t.keyword}>
                      <div className="grow"><div className="title">{t.keyword}</div></div>
                      <span className="muted">{t.n}× · avg {t.avg_results}</span>
                    </li>
                  ))}
                  {analytics.top.length === 0 && <li className="muted">No data yet.</li>}
                </ul>
              </div>
              <div className="grow">
                <h3 style={{ fontSize: 14 }}>No results</h3>
                <ul className="plain-list">
                  {analytics.zero.map((t) => (
                    <li key={t.keyword}>
                      <div className="grow"><div className="title">{t.keyword}</div></div>
                      <span className="muted">{t.n}×</span>
                    </li>
                  ))}
                  {analytics.zero.length === 0 && <li className="muted">None.</li>}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 17, marginTop: 0 }}>Possible duplicates</h2>
        {dups.length === 0 ? <div className="muted">No duplicate titles found.</div> : (
          <ul className="plain-list">
            {dups.map((g) => (
              <li key={g.key}>
                <div className="grow">
                  <div className="title">{g.titles[0]}</div>
                  <div className="sub">
                    {g.ids.map((id, i) => (
                      <span key={id}>
                        {i > 0 && " · "}
                        <Link to={`/listing/${id}`}>#{id}</Link>
                      </span>
                    ))}
                  </div>
                </div>
                <span className="pill pill-warn">{g.n} listings</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
