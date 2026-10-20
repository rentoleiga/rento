import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, formatPrice } from "../api";

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

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
};

export default function ReceiptPage() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/api/payments/${id}`)
      .then((d) => setP(d.payment))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="container section"><div className="empty"><h3>{error}</h3></div></div>;
  if (!p) return <div className="container section"><div className="empty">Hleður…</div></div>;

  return (
    <div className="container section" style={{ maxWidth: 640 }}>
      <div className="row no-print" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <Link to="/dashboard/payments">← Kvittanir</Link>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Prenta</button>
      </div>

      <div className="detail-section" style={{ marginTop: 0 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>Kvittun</h1>
            <p className="muted" style={{ margin: "4px 0 0" }}>Rentó · www.rento.is</p>
          </div>
          <div className="text-right">
            <div style={{ fontWeight: 700 }}>#{p.id}</div>
            <div className="muted" style={{ fontSize: 13 }}>{fmtDate(p.created_at)}</div>
          </div>
        </div>

        <table style={{ width: "100%", marginTop: 22 }}>
          <tbody>
            <tr>
              <td className="muted">Tegund</td>
              <td className="text-right">{KIND_LABEL[p.kind] || p.kind}</td>
            </tr>
            {p.package_id && (
              <tr>
                <td className="muted">Pakki</td>
                <td className="text-right">{PACKAGE_LABEL[p.package_id] || p.package_id}</td>
              </tr>
            )}
            {p.listing_title && (
              <tr>
                <td className="muted">Auglýsing</td>
                <td className="text-right">
                  {p.listing_slug ? <Link to={`/listing/${p.listing_slug}`}>{p.listing_title}</Link> : p.listing_title}
                </td>
              </tr>
            )}
            {Number(p.discount) > 0 && (
              <tr>
                <td className="muted">Afsláttur {p.promo_code ? `(${p.promo_code})` : ""}</td>
                <td className="text-right">−{formatPrice(p.discount, p.currency)}</td>
              </tr>
            )}
            <tr>
              <td style={{ fontWeight: 700, paddingTop: 12 }}>Samtals</td>
              <td className="text-right" style={{ fontWeight: 700, paddingTop: 12 }}>
                {formatPrice(p.amount, p.currency)}
              </td>
            </tr>
            <tr>
              <td className="muted">Staða</td>
              <td className="text-right">{p.status === "paid" ? "Greitt" : p.status === "refunded" ? "Endurgreitt" : p.status}</td>
            </tr>
          </tbody>
        </table>

        <p className="muted" style={{ fontSize: 12, marginTop: 24 }}>
          Kvittun fyrir kaupum á auglýsingaplássi eða kynningu. Leigugreiðslur fara fram beint milli leigjanda og leigusala.
        </p>
      </div>
    </div>
  );
}
