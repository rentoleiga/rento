import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api, downloadFile } from "../../api";
import { fmt, fmtIsk, shortDate, StatusPill, statusLabel } from "./shared";

function Pagination({ page, pages, setPage, load, extraArgs }) {
  if (pages <= 1) return null;
  return (
    <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: "center" }}>
      <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(p, ...extraArgs); }}>← Prev</button>
      <span className="muted">Page {page} / {pages}</span>
      <button className="btn btn-sm btn-outline" disabled={page >= pages} onClick={() => { const p = page + 1; setPage(p); load(p, ...extraArgs); }}>Next →</button>
    </div>
  );
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [payPage, setPayPage] = useState(1);

  const [purchases, setPurchases] = useState([]);
  const [purchasesTotal, setPurchasesTotal] = useState(0);
  const [purchasesSummary, setPurchasesSummary] = useState({ revenue: 0, credits: 0 });
  const [purPage, setPurPage] = useState(1);
  const [purUser, setPurUser] = useState("");

  const [ledger, setLedger] = useState([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledPage, setLedPage] = useState(1);
  const [ledUser, setLedUser] = useState("");

  const [error, setError] = useState("");

  const loadPayments = useCallback((p) => {
    return api.get(`/api/admin/transactions?page=${p}&perPage=25`).then((d) => {
      setPayments(d.transactions || []);
      setPaymentsTotal(d.total || 0);
    }).catch((e) => setError(e.message));
  }, []);

  const loadPurchases = useCallback((p, user) => {
    const params = new URLSearchParams({ page: String(p), perPage: "25" });
    if (user) params.set("q", user);
    return api.get(`/api/admin/credit-payments?${params}`).then((d) => {
      setPurchases(d.payments || []);
      setPurchasesTotal(d.total || 0);
      setPurchasesSummary(d.summary || { revenue: 0, credits: 0 });
    }).catch((e) => setError(e.message));
  }, []);

  const loadLedger = useCallback((p, user) => {
    const params = new URLSearchParams({ page: String(p), perPage: "25" });
    if (user) params.set("q", user);
    return api.get(`/api/admin/credit-ledger?${params}`).then((d) => {
      setLedger(d.entries || []);
      setLedgerTotal(d.total || 0);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { loadPayments(payPage); }, [payPage, loadPayments]);
  useEffect(() => {
    const h = setTimeout(() => { setPurPage(1); loadPurchases(1, purUser); }, 350);
    return () => clearTimeout(h);
  }, [purUser, loadPurchases]);
  useEffect(() => { loadPurchases(purPage, purUser); }, [purPage, loadPurchases]);
  useEffect(() => {
    const h = setTimeout(() => { setLedPage(1); loadLedger(1, ledUser); }, 350);
    return () => clearTimeout(h);
  }, [ledUser, loadLedger]);
  useEffect(() => { loadLedger(ledPage, ledUser); }, [ledPage, loadLedger]);

  const payPages = Math.max(1, Math.ceil(paymentsTotal / 25));
  const purPages = Math.max(1, Math.ceil(purchasesTotal / 25));
  const ledPages = Math.max(1, Math.ceil(ledgerTotal / 25));

  return (
    <>
      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 17, margin: 0 }}>Booking payments</h2>
          <button className="btn btn-sm btn-outline" onClick={() => downloadFile("/api/admin/export/payments.csv", "rento-payments.csv")}>
            Download CSV
          </button>
        </div>
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Booking</th>
                <th>Payer</th>
                <th>Recipient</th>
                <th>Amount</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((t) => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td>{t.booking_id ? `#${t.booking_id}` : <span className="muted">—</span>}</td>
                  <td>{t.payer_email ? <Link to={`/users/${t.payer_id}`}>{t.payer_email}</Link> : <span className="muted">—</span>}</td>
                  <td>{t.recipient_email ? <Link to={`/users/${t.recipient_id}`}>{t.recipient_email}</Link> : <span className="muted">—</span>}</td>
                  <td>{fmtIsk(t.amount)}</td>
                  <td>{t.platform_fee ? fmtIsk(t.platform_fee) : "—"}</td>
                  <td><StatusPill status={t.status} label={statusLabel(t.status)} /></td>
                  <td className="muted">{shortDate(t.created_at)}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={8} className="muted">No booking payments yet — bookings still use mock payments.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={payPage} pages={payPages} setPage={setPayPage} load={loadPayments} extraArgs={[]} />
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ fontSize: 17, margin: 0 }}>
            Credit purchases
            <span className="muted" style={{ fontSize: 13, fontWeight: "normal", marginLeft: 10 }}>
              {fmt(purchasesTotal)} total · {fmtIsk(purchasesSummary.revenue)} revenue · {fmt(purchasesSummary.credits)} credits
            </span>
          </h2>
          <div className="row" style={{ gap: 8 }}>
            <input
              className="admin-search"
              style={{ width: 200 }}
              placeholder="Search user…"
              value={purUser}
              onChange={(e) => setPurUser(e.target.value)}
            />
            <button className="btn btn-sm btn-outline" onClick={() => downloadFile("/api/admin/export/credits.csv", "rento-credits.csv")}>
              Download CSV
            </button>
          </div>
        </div>
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Package</th>
                <th>Credits</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td>{p.user_email ? <Link to={`/users/${p.user_id}`}>{p.user_email}</Link> : <span className="muted">—</span>}</td>
                  <td>{p.package_id}</td>
                  <td>{fmt(p.credits)}</td>
                  <td>{fmtIsk(p.amount)}</td>
                  <td className="muted">{p.provider_reference || "—"}</td>
                  <td className="muted">{shortDate(p.created_at)}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr><td colSpan={7} className="muted">No credit purchases yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={purPage} pages={purPages} setPage={setPurPage} load={loadPurchases} extraArgs={[purUser]} />
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ fontSize: 17, margin: 0 }}>Credit ledger</h2>
          <input
            className="admin-search"
            style={{ width: 200 }}
            placeholder="Search user…"
            value={ledUser}
            onChange={(e) => setLedUser(e.target.value)}
          />
        </div>
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Listing</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((e) => (
                <tr key={e.id}>
                  <td>#{e.id}</td>
                  <td>{e.user_email ? <Link to={`/users/${e.user_id}`}>{e.user_email}</Link> : <span className="muted">—</span>}</td>
                  <td><span className="pill">{statusLabel(e.type)}</span></td>
                  <td style={{ color: e.amount >= 0 ? "var(--ok, #059669)" : "var(--danger, #dc2626)" }}>
                    {e.amount >= 0 ? "+" : ""}{fmt(e.amount)}
                  </td>
                  <td className="muted">{e.description || "—"}</td>
                  <td>{e.listing_id ? <Link to={`/listing/${e.listing_id}`}>#{e.listing_id}</Link> : <span className="muted">—</span>}</td>
                  <td className="muted">{shortDate(e.created_at)}</td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr><td colSpan={7} className="muted">No credit entries.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={ledPage} pages={ledPages} setPage={setLedPage} load={loadLedger} extraArgs={[ledUser]} />
      </div>
    </>
  );
}
