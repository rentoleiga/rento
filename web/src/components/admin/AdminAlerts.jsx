import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { fmt, shortDate } from "./shared";

const RULE_LABEL = {
  balance_mismatch: "Kredit stanje se ne poklapa sa knjigom",
  negative_balance: "Negativno kredit stanje",
  orphan_balance: "Kredit bez izvora (bez kupovine)",
  big_purchase: "Kupovina veća od najvećeg paketa",
  burst_purchase: "Ponovljene kupovine u kratkom vremenu",
  multi_account_ip: "Više naloga sa iste IP adrese",
  boost_foreign: "Boost na tuđoj auglýsingu",
};
const SEV_CLASS = { critical: "pill pill-danger", warn: "pill pill-warn", info: "pill" };
const STATUS_LABEL = { open: "Otvoren", reviewed: "Pregledan", dismissed: "Odbačen" };

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ open: 0, reviewed: 0, dismissed: 0, critical: 0 });
  const [status, setStatus] = useState("open");
  const [rule, setRule] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");

  const load = useCallback((s, r) => {
    const params = new URLSearchParams({ perPage: "30" });
    if (s) params.set("status", s);
    if (r) params.set("rule", r);
    return api.get(`/api/admin/alerts?${params}`).then((d) => {
      setAlerts(d.alerts || []);
      setTotal(d.total || 0);
      setCounts(d.counts || {});
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const h = setTimeout(() => load(status, rule), 250);
    return () => clearTimeout(h);
  }, [status, rule, load]);

  const scan = async () => {
    setScanning(true);
    setScanMsg("");
    try {
      const r = await api.post("/api/admin/credits/scan", {});
      setScanMsg(`Skeniranje završeno: ${r.created} novih upozorenja (od ${r.rules} pravila).`);
      await load(status, rule);
    } catch (e) {
      setError(e.message);
    } finally {
      setScanning(false);
    }
  };

  const handle = async (a, next) => {
    setBusy(`${a.id}`);
    try {
      await api.patch(`/api/admin/alerts/${a.id}/status`, { status: next });
      await load(status, rule);
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <div className="dash-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-num">{fmt(counts.open)}</div>
          <div className="stat-label">Otvorena upozorenja</div>
          <div className="muted" style={{ fontSize: 12 }}>od toga {fmt(counts.critical)} kritičnih</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(counts.reviewed)}</div>
          <div className="stat-label">Pregledana</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{fmt(counts.dismissed)}</div>
          <div className="stat-label">Odbačena</div>
        </div>
        <div className="stat-card">
          <button className="btn btn-primary btn-block" disabled={scanning} onClick={scan}>
            {scanning ? "Skeniram…" : "Skeniraj sada"}
          </button>
          {scanMsg && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{scanMsg}</div>}
        </div>
      </div>

      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">Otvorena</option>
          <option value="reviewed">Pregledana</option>
          <option value="dismissed">Odbačena</option>
          <option value="">Sva</option>
        </select>
        <select className="admin-select" value={rule} onChange={(e) => setRule(e.target.value)}>
          <option value="">Sva pravila</option>
          {Object.keys(RULE_LABEL).map((k) => (
            <option key={k} value={k}>{RULE_LABEL[k]}</option>
          ))}
        </select>
        <span className="muted">{fmt(total)} upozorenja</span>
        {error && <span className="form-error">{error}</span>}
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ozbiljnost</th>
              <th>Pravilo</th>
              <th>Korisnik</th>
              <th>Iznos</th>
              <th>IP</th>
              <th>Detalji</th>
              <th>Otkriveno</th>
              <th>Akcija</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id}>
                <td><span className={SEV_CLASS[a.severity] || "pill"}>{a.severity}</span></td>
                <td>
                  <strong>{RULE_LABEL[a.rule] || a.rule}</strong>
                  <div className="muted" style={{ fontSize: 12 }}>{a.rule}</div>
                </td>
                <td>
                  {a.user_id ? (
                    <Link to={`/users/${a.user_id}`} className="admin-user">{a.user_email || `#${a.user_id}`}</Link>
                  ) : (
                    <span className="muted">više naloga</span>
                  )}
                  {a.listing_id && <div className="muted" style={{ fontSize: 12 }}>auglýsing #{a.listing_id}</div>}
                </td>
                <td>{a.amount === null ? "—" : fmt(a.amount)}</td>
                <td className="muted">{a.ip || "—"}</td>
                <td className="muted" style={{ fontSize: 12, maxWidth: 260 }}>
                  {a.detail ? JSON.stringify(a.detail) : "—"}
                </td>
                <td className="muted">{shortDate(a.created_at)}</td>
                <td>
                  {a.status === "open" ? (
                    <div className="admin-row-actions">
                      <button className="btn btn-sm btn-outline" disabled={busy === `${a.id}`} onClick={() => handle(a, "reviewed")}>
                        Pregledano
                      </button>
                      <button className="btn btn-sm" disabled={busy === `${a.id}`} onClick={() => handle(a, "dismissed")}>
                        Odbaci
                      </button>
                    </div>
                  ) : (
                    <span className="muted">
                      {STATUS_LABEL[a.status]}
                      {a.reviewed_by_email ? ` (${a.reviewed_by_email})` : ""}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr><td colSpan={8} className="muted">Nema upozorenja u ovom filteru. Klikni "Skeniraj sada" da proveriš sve naloge.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
