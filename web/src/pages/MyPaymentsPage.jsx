import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatPrice } from "../api";
import { fmtDate } from "../lib/dates";

const KIND_LABEL = { slot: "Auglýsingapláss", promotion: "Boost", booking: "Bókun" };
const STATUS_LABEL = {
  paid: "Greitt",
  pending: "Bíður greiðslu",
  failed: "Mistókst",
  expired: "Útrunnið",
  refunded: "Endurgreitt",
  refund_pending: "Endurgreiðsla í vinnslu",
  partially_refunded: "Endurgreitt að hluta",
};
const STATUS_CLASS = {
  paid: "pill-ok",
  pending: "pill-warn",
  failed: "pill-danger",
  expired: "pill-danger",
  refunded: "pill-warn",
  refund_pending: "pill-warn",
  partially_refunded: "pill-warn",
};
const PACKAGE_LABEL = {
  single: "Stakt pláss",
  pkg3: "3 pláss",
  pkg5: "5 pláss",
  pkg10: "10 pláss",
  silver: "Silfur",
  gold: "Gull",
  platinum: "Platína",
};

const describe = (p) => {
  const pkg = PACKAGE_LABEL[p.package_id];
  if (p.kind === "slot") return `Auglýsingapláss${pkg ? ` — ${pkg}` : ""}`;
  if (p.kind === "promotion") return `Boost${pkg ? ` — ${pkg}` : ""}`;
  if (p.kind === "booking") return `Bókun${p.listing_title ? ` — ${p.listing_title}` : ""}`;
  return KIND_LABEL[p.kind] || p.kind;
};

const isFreshCheckout = (p) =>
  p.checkout_url && Date.now() - new Date(p.created_at).getTime() < 60 * 60 * 1000;

export default function MyPaymentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      api
        .get("/api/payments/mine")
        .then((d) => setRows(d.payments || []))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const sum = (status) =>
    rows.filter((r) => r.status === status).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const paidTotal = sum("paid");
  const pendingTotal = sum("pending");
  const refundedTotal = sum("refunded");
  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <div className="container section" style={{ maxWidth: 900 }}>
      <h1 className="mt0">Greiðslur</h1>
      <p className="muted" style={{ marginTop: -6 }}>
        Öll kaup á plássum, Boost og bókunum — með stöðu, upphæð og möguleika á að klára eða athuga greiðslu.
      </p>

      {!loading && rows.length > 0 && (
        <div className="credit-stats" style={{ margin: "18px 0 22px" }}>
          <div className="credit-stat">
            <strong>{formatPrice(paidTotal, "ISK")}</strong>
            <span>Greitt</span>
          </div>
          <div className="credit-stat">
            <strong>{formatPrice(pendingTotal, "ISK")}</strong>
            <span>Bíður greiðslu{pendingCount ? ` (${pendingCount})` : ""}</span>
          </div>
          {refundedTotal > 0 && (
            <div className="credit-stat">
              <strong>{formatPrice(refundedTotal, "ISK")}</strong>
              <span>Endurgreitt</span>
            </div>
          )}
        </div>
      )}

      {error && <div className="form-error" style={{ marginBottom: 14 }}>{error}</div>}

      {loading ? (
        <div className="empty">Hleður…</div>
      ) : rows.length === 0 ? (
        <div className="empty">
          <h3>Engar greiðslur ennþá</h3>
          <p>Þegar þú kaupir pláss, Boost eða bókar birtist greiðslan hér.</p>
          <Link className="btn btn-primary" to="/promote">Sjá verð og pláss</Link>
        </div>
      ) : (
        <ul className="plain-list">
          {rows.map((p) => (
            <li key={p.id}>
              <div className="grow">
                <div className="title">{describe(p)}</div>
                <div className="sub">
                  {fmtDate(p.created_at)}
                  {p.kind !== "booking" && p.listing_title && (
                    <>
                      {" · "}
                      {p.listing_slug ? (
                        <Link to={`/listing/${p.listing_slug}`}>{p.listing_title}</Link>
                      ) : (
                        p.listing_title
                      )}
                    </>
                  )}
                  {p.status === "pending" && p.failed_reason && ` · ${p.failed_reason}`}
                </div>

                {p.status === "pending" && isFreshCheckout(p) && (
                  <div className="row" style={{ marginTop: 8, gap: 8, flexWrap: "wrap" }}>
                    <a
                      className="btn btn-primary btn-sm"
                      href={p.checkout_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Klára greiðslu
                    </a>
                  </div>
                )}

                {(p.status === "failed" || p.status === "expired") && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <Link
                      className="btn btn-outline btn-sm"
                      to={p.kind === "booking" ? "/dashboard/bookings" : "/promote"}
                    >
                      Reyna aftur
                    </Link>
                  </div>
                )}
              </div>

              <div className="text-right">
                <strong>{formatPrice(p.amount, p.currency)}</strong>
                {Number(p.discount) > 0 && (
                  <div className="muted" style={{ fontSize: 12 }}>
                    afsláttur {formatPrice(p.discount, p.currency)}
                  </div>
                )}
                <div style={{ marginTop: 4 }}>
                  <span className={`pill ${STATUS_CLASS[p.status] || ""}`}>
                    {STATUS_LABEL[p.status] || p.status}
                  </span>
                </div>
                {["paid", "refunded", "refund_pending"].includes(p.status) && (
                  <Link
                    className="btn btn-outline btn-sm"
                    to={`/receipt/${p.id}`}
                    style={{ marginTop: 6 }}
                  >
                    Kvittun
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
