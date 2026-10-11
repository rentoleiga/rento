import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api, downloadFile } from "../../api";
import { fmt, fmtIsk, shortDate, StatusPill, statusLabel } from "./shared";

export default function AdminPayments() {
  const [tx, setTx] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txStatus, setTxStatus] = useState("");
  const [ledger, setLedger] = useState([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerType, setLedgerType] = useState("");
  const [ledgerQ, setLedgerQ] = useState("");
  const [pays, setPays] = useState([]);
  const [payTotal, setPayTotal] = useState(0);
  const [paySummary, setPaySummary] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const loadTx = useCallback((s) => {
    const params = new URLSearchParams({ perPage: "30" });
    if (s) params.set("status", s);
    return api.get(`/api/admin/transactions?${params}`).then((d) => {
      setTx(d.transactions || []);
      setTxTotal(d.total || 0);
    }).catch((e) => setError(e.message));
  }, []);

  const loadLedger = useCallback((t, q) => {
    const params = new URLSearchParams({ perPage: "30" });
    if (t) params.set("type", t);
    if (q) params.set("q", q);
    return api.get(`/api/admin/credit-ledger?${params}`).then((d) => {
      setLedger(d.ledger || []);
      setLedgerTotal(d.total || 0);
    }).catch((e) => setError(e.message));
  }, []);

  const loadPays = useCallback(() => {
    return api.get("/api/admin/credit-payments?perPage=30").then((d) => {
      setPays(d.payments || []);
      setPayTotal(d.total || 0);
      setPaySummary(d.summary || null);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { loadTx(txStatus); }, [txStatus, loadTx]);
  useEffect(() => { loadPays(); }, [loadPays]);

  useEffect(() => {
    const h = setTimeout(() => loadLedger(ledgerType, ledgerQ), 350);
    return () => clearTimeout(h);
  }, [ledgerType, ledgerQ, loadLedger]);

  const exportCsv = async (kind) => {
    setBusy(kind);
    try {
      await downloadFile(`/api/admin/export/${kind}.csv`, `rento-${kind}.csv`);
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>Greiðslur bókana</h2>
        <span className="muted">{fmt(txTotal)}</span>
        <select className="admin-select" value={txStatus} onChange={(e) => setTxStatus(e.target.value)}>
          <option value="">Allar</option>
          <option value="paid">Greiðsla</option>
          <option value="authorized">Heimilað</option>
          <option value="pending">Bið</option>
          <option value="failed">Misheppnað</option>
          <option value="refunded">Endurgreitt</option>
        </select>
        <button className="btn btn-outline btn-sm" disabled={busy === "transactions"} onClick={() => exportCsv("transactions")}>
          {busy === "transactions" ? "…" : "Sækja CSV"}
        </button>
      </div>

      <div className="table-wrap" style={{ marginBottom: 34 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Bókun</th>
              <th>Greiðandi</th>
              <th>Fékk</th>
              <th>Upphæð</th>
              <th>Þóknun</th>
              <th>Staða</th>
              <th>Tími</th>
            </tr>
          </thead>
          <tbody>
            {tx.map((t) => (
              <tr key={t.id}>
                <td className="muted">{t.id}</td>
                <td className="muted">#{t.booking_id}</td>
                <td>{t.payer_email || <span className="muted">—</span>}</td>
                <td>{t.receiver_email || <span className="muted">—</span>}</td>
                <td>{fmtIsk(t.amount)} {t.currency}</td>
                <td>{fmtIsk(t.platform_fee)}</td>
                <td><StatusPill status={t.status} label={statusLabel(t.status)} /></td>
                <td className="muted">{shortDate(t.created_at)}</td>
              </tr>
            ))}
            {tx.length === 0 && (
              <tr><td colSpan={8} className="muted">Engar greiðslur. Bókanaferlið notar enn prufugreiðslur.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>Kupovine kredita</h2>
        <span className="muted">{fmt(payTotal)}</span>
        {paySummary && (
          <span className="muted">
            ukupno {fmtIsk(paySummary.revenue)} · {fmt(paySummary.credits)} kredita
          </span>
        )}
      </div>

      <div className="table-wrap" style={{ marginBottom: 34 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Korisnik</th>
              <th>Paket</th>
              <th>Kredit</th>
              <th>Iznos</th>
              <th>Referenca</th>
              <th>Trenutak</th>
            </tr>
          </thead>
          <tbody>
            {pays.map((p) => (
              <tr key={p.id}>
                <td className="muted">{p.id}</td>
                <td>{p.user_email ? <Link to={`/users/${p.user_id}`}>{p.user_email}</Link> : <span className="muted">—</span>}</td>
                <td><StatusPill status={p.status} label={`${p.package_id} (${statusLabel(p.status)})`} /></td>
                <td>{fmt(p.credits)}</td>
                <td>{fmtIsk(p.amount)} {p.currency}</td>
                <td className="muted">{p.provider_reference || "—"}</td>
                <td className="muted">{shortDate(p.created_at)}</td>
              </tr>
            ))}
            {pays.length === 0 && (
              <tr><td colSpan={7} className="muted">Još nema kupovina kredita.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>Kreditfærslur</h2>
        <span className="muted">{fmt(ledgerTotal)}</span>
        <input
          className="admin-search"
          style={{ minWidth: 180 }}
          placeholder="Leita að notanda…"
          value={ledgerQ}
          onChange={(e) => setLedgerQ(e.target.value)}
        />
        <select className="admin-select" value={ledgerType} onChange={(e) => setLedgerType(e.target.value)}>
          <option value="">Allar</option>
          <option value="purchase">Kaup</option>
          <option value="slot">Pláss</option>
          <option value="boost">Boost</option>
          <option value="adjustment">Aðlögun</option>
        </select>
        <button className="btn btn-outline btn-sm" disabled={busy === "credits"} onClick={() => exportCsv("credits")}>
          {busy === "credits" ? "…" : "Sækja CSV"}
        </button>
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Notandi</th>
              <th>Tegund</th>
              <th>Magn</th>
              <th>Lýsing</th>
              <th>Auglýsing</th>
              <th>Tími</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((c) => (
              <tr key={c.id}>
                <td className="muted">{c.id}</td>
                <td>{c.user_email ? <Link to={`/users/${c.user_id}`}>{c.user_email}</Link> : <span className="muted">—</span>}</td>
                <td>{statusLabel(c.type)}</td>
                <td>
                  <strong style={{ color: c.amount > 0 ? "#047857" : "#b91c1c" }}>
                    {c.amount > 0 ? "+" : ""}{fmt(c.amount)}
                  </strong>
                </td>
                <td>{c.description}</td>
                <td className="muted">{c.listing_id ? `#${c.listing_id}` : "—"}</td>
                <td className="muted">{shortDate(c.created_at)}</td>
              </tr>
            ))}
            {ledger.length === 0 && (
              <tr><td colSpan={7} className="muted">Engar kreditfærslur fundust.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
