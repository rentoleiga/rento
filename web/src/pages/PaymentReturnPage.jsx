import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, formatPrice } from "../api";

const KIND_LABEL = { slot: "Auglýsingapláss", promotion: "Boost", booking: "Bókun" };
const STATUS_TEXT = {
  pending: "Greiðslan er í vinnslu",
  failed: "Greiðsla mistókst",
  expired: "Greiðslutíminn rann út",
  refunded: "Endurgreitt",
  refund_pending: "Endurgreiðsla í vinnslu",
};

function targetFor(payment) {
  if (!payment) return { to: "/dashboard", label: "Á stjórnborðið" };
  if (payment.kind === "promotion") {
    return {
      to: `/promote?listing=${payment.reference_id || ""}`,
      label: "Fara í Boost",
    };
  }
  if (payment.kind === "booking") return { to: "/dashboard/bookings", label: "Fara á bókanir" };
  return { to: "/dashboard/listings", label: "Fara á auglýsingar" };
}

export default function PaymentReturnPage() {
  const [params] = useSearchParams();
  const ref = params.get("ref") || "";
  const cancelled = params.get("status") === "cancelled";
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!cancelled);

  useEffect(() => {
    if (!ref || cancelled) {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    let timer = null;
    let tries = 0;

    const load = async () => {
      try {
        const d = await api.get(`/api/payments/checkout/${encodeURIComponent(ref)}`);
        if (!alive) return;
        setPayment(d.payment || null);
        if (d.payment?.status === "pending" && tries < 10) {
          tries += 1;
          timer = setTimeout(load, 2000);
        } else {
          setLoading(false);
        }
      } catch (e) {
        if (!alive) return;
        setError(e.message);
        setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [ref, cancelled]);

  if (cancelled) {
    return (
      <div className="container section" style={{ maxWidth: 640 }}>
        <div className="detail-section" style={{ textAlign: "center" }}>
          <h1 style={{ marginTop: 0 }}>Greiðslu hætt við</h1>
          <p className="muted">Ekkert var gjaldfært. Þú getur sótt það sem þú vildir hvenær sem er.</p>
          <div className="row" style={{ justifyContent: "center", gap: 12, marginTop: 18 }}>
            <Link className="btn btn-primary" to="/promote">Fara í Boost og pláss</Link>
            <Link className="btn btn-outline" to="/dashboard/bookings">Bókanir</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container section" style={{ maxWidth: 640 }}>
        <div className="empty">Hleður greiðslu…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container section" style={{ maxWidth: 640 }}>
        <div className="detail-section" style={{ textAlign: "center" }}>
          <h1 style={{ marginTop: 0 }}>Gat ekki sótt greiðslu</h1>
          <p className="form-error">{error}</p>
          <Link className="btn btn-primary" to="/dashboard/payments">Fara á kvittanir</Link>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container section" style={{ maxWidth: 640 }}>
        <div className="detail-section" style={{ textAlign: "center" }}>
          <h1 style={{ marginTop: 0 }}>Greiðsla fannst ekki</h1>
          <Link className="btn btn-primary" to="/dashboard/payments">Fara á kvittanir</Link>
        </div>
      </div>
    );
  }

  const paid = payment.status === "paid";
  const target = targetFor(payment);

  return (
    <div className="container section" style={{ maxWidth: 640 }}>
      <div className="detail-section" style={{ textAlign: "center" }}>
        <h1 style={{ marginTop: 0 }}>{paid ? "Takk fyrir!" : STATUS_TEXT[payment.status] || "Greiðsla"}</h1>
        <p className="muted" style={{ marginTop: -4 }}>
          {KIND_LABEL[payment.kind] || payment.kind}
          {payment.listing_title ? ` · ${payment.listing_title}` : ""}
          {" · "}
          {formatPrice(payment.amount, payment.currency)}
        </p>
        <p>
          {paid
            ? "Greiðslan hefur verið móttekin og kaupin eru virk."
            : "Við bíðum eftir staðfestingu frá greiðslukerfinu. Þetta getur tekið nokkrar sekúndur."}
        </p>
        {payment.failed_reason && payment.status !== "paid" && (
          <p className="form-error">{payment.failed_reason}</p>
        )}
        <div className="row" style={{ justifyContent: "center", gap: 12, marginTop: 18 }}>
          <Link className="btn btn-primary" to={target.to}>{target.label}</Link>
          <Link className="btn btn-outline" to="/dashboard/payments">Kvittanir</Link>
        </div>
      </div>
    </div>
  );
}
