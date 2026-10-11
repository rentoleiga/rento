import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { shortDate, StatusPill, statusLabel, fmt } from "./shared";

const RULES = [
  ["balance_mismatch", "Balance mismatch"],
  ["negative_balance", "Negative balance"],
  ["orphan_balance", "Orphan balance"],
  ["big_purchase", "Big purchase"],
  ["burst_purchase", "Burst purchases"],
  ["multi_account_ip", "Multiple accounts per IP"],
  ["boost_foreign", "Boost on foreign listing"],
];
const ruleLabel = (r) => (RULES.find((x) => x[0] === r) || [null, r])[1];

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("open");
  const [ruleFilter, setRuleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback((p, st, rule) => {
    const params = new URLSearchParams({ page: String(p), perPage: "50" });
    if (st && st !== "all") params.set("status", st);
    if (rule) params.set("rule", rule);
    return api.get(`/api/admin/alerts?${params}`).then((d) => {
      setAlerts(d.alerts || []);
      setCounts(d.counts || {});
      setTotal(d.total || 0);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { setPage(1); load(1, statusFilter, ruleFilter); }, [statusFilter, ruleFilter, load]);
  useEffect(() => { load(page, statusFilter, ruleFilter); }, [page, load]);

  const setStatus = async (a, st) => {
    setBusyId(a.id);
    try {
      await api.patch(`/api/admin/alerts/${a.id}/status`, { status: st });
      await load(page, statusFilter, ruleFilter);
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const scan = async () => {
    setScanning(true);
    setScanMsg("");
    try {
      const d = await api.post("/api/admin/credits/scan", {});
      setScanMsg(`Scan finished: ${d.created} new alerts (out of ${d.rules} rules).`);
      await load(page, statusFilter, ruleFilter);
    } catch (e) {
      setScanMsg(e.message);
    } finally {
      setScanning(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / 50));

  return (
    <>
      <div className="dash-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-num">{fmt(counts.open)}</div>
          <div className="stat-label">Open alerts</div>
          <div className="muted" style={{ fontSize: 12 }}>{fmt(counts.critical)} critical</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(counts.reviewed)}</div>
          <div className="stat-label">Reviewed</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(counts.dismissed)}</div>
          <div className="stat-label">Dismissed</div>
        </div>
        <div className="stat-card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={scan} disabled={scanning}>
            {scanning ? "Scanning…" : "Scan now"}
          </button>
        </div>
      </div>

      {scanMsg && <div className="form-error" style={{ marginBottom: 12 }}>{scanMsg}</div>}
      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="open">Open</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>
        <select className="admin-select" value={ruleFilter} onChange={(e) => setRuleFilter(e.target.value)}>
          <option value="">All rules</option>
          {RULES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="muted">{fmt(total)} results</span>
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Severity</th>
              <th>User</th>
              <th>Detail</th>
              <th>IP</th>
              <th>Status</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>{ruleLabel(a.rule)}</strong>
                  <div className="muted" style={{ fontSize: 12 }}>{a.rule}</div>
                </td>
                <td>
                  <span className={`pill ${a.severity === "critical" ? "pill-danger" : "pill-warn"}`}>
                    {a.severity}
                  </span>
                </td>
                <td>
                  {a.user_id ? <Link to={`/users/${a.user_id}`}>{a.user_email || `user #${a.user_id}`}</Link> : <span className="muted">—</span>}
                  {a.listing_id && <div className="muted" style={{ fontSize: 12 }}>listing #{a.listing_id}</div>}
                </td>
                <td className="muted" style={{ fontSize: 12, maxWidth: 280 }}>
                  {a.rule === "multi_account_ip" && a.detail?.accounts
                    ? `${a.detail.accounts} accounts`
                    : JSON.stringify(a.detail || {})}
                </td>
                <td className="muted">{a.ip || "—"}</td>
                <td><StatusPill status={a.status} label={statusLabel(a.status)} /></td>
                <td className="muted">{shortDate(a.created_at)}</td>
                <td>
                  <div className="admin-row-actions">
                    {a.status !== "reviewed" && (
                      <button className="btn btn-sm btn-outline" disabled={busyId === a.id} onClick={() => setStatus(a, "reviewed")}>
                        Reviewed
                      </button>
                    )}
                    {a.status !== "dismissed" && (
                      <button className="btn btn-sm btn-outline" disabled={busyId === a.id} onClick={() => setStatus(a, "dismissed")}>
                        Dismiss
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr><td colSpan={8} className="muted">No alerts in this filter. Click "Scan now" to check all accounts.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 50 && (
        <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: "center" }}>
          <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="muted">Page {page} / {pages}</span>
          <button className="btn btn-sm btn-outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </>
  );
}
