import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatPrice } from "../api";
import { fmtDate } from "../lib/dates";

const KIND_LABEL = { slot: "Auglýsingapláss", promotion: "Kynning" };
const PACKAGE_LABEL = {
  single: "Stakt pláss",
  pkg3: "3 pláss",
  pkg5: "5 pláss",
  pkg10: "10 pláss",
  silver: "Silfur",
  gold: "Gull",
  platinum: "Platína",
};

export default function MyPaymentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/payments/mine")
      .then((d) => setRows(d.payments || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return (
    <div className="container section" style={{ maxWidth: 880 }}>
      <h1 className="mt0">Kvittanir</h1>
      <p className="muted" style={{ marginTop: -6 }}>
        Kaup á auglýsingaplássum og kynningum. Leigugreiðslur fara fram beint á milli aðila.
      </p>

      {loading ? (
        <div className="empty">Hleður…</div>
      ) : rows.length === 0 ? (
        <div className="empty">
          <h3>Engar kvittanir ennþá</h3>
          <p>Þegar þú kaupir pláss eða kynningu birtist kvittunin hér.</p>
          <Link className="btn btn-primary" to="/promote">Sjá verð og pláss</Link>
        </div>
      ) : (
        <>
          <ul className="plain-list">
            {rows.map((p) => (
              <li key={p.id}>
                <div className="grow">
                  <div className="title">
                    {KIND_LABEL[p.kind] || p.kind}
                    {p.package_id && p.package_id !== "single" ? ` — ${PACKAGE_LABEL[p.package_id] || p.package_id}` : ""}
                  </div>
                  <div className="sub">
                    {fmtDate(p.created_at)}
                    {p.listing_title && (
                      <>
                        {" · "}
                        {p.listing_slug ? (
                          <Link to={`/listing/${p.listing_slug}`}>{p.listing_title}</Link>
                        ) : (
                          p.listing_title
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <strong>{formatPrice(p.amount, p.currency)}</strong>
                  {Number(p.discount) > 0 && (
                    <div className="muted" style={{ fontSize: 12 }}>afsláttur {formatPrice(p.discount, p.currency)}</div>
                  )}
                  <div className="muted" style={{ fontSize: 12 }}>{p.status === "paid" ? "Greitt" : p.status === "refunded" ? "Endurgreitt" : p.status}</div>
                  <Link className="btn btn-outline btn-sm" to={`/receipt/${p.id}`} style={{ marginTop: 6 }}>Kvittun</Link>
                </div>
              </li>
            ))}
          </ul>
          <div className="detail-section" style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
            <span>Samtals</span>
            <span>{formatPrice(total, "ISK")}</span>
          </div>
        </>
      )}
    </div>
  );
}
