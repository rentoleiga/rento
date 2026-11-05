import React, { useEffect, useRef, useState } from "react";
import { api, formatPrice } from "../api";

const BAD_STATUSES = ["failed", "expired", "refunded"];

export default function PaymentOverlay({ reference, amount, currency = "ISK", label, url, onDone, onClose }) {
  const [payment, setPayment] = useState(null);
  const [state, setState] = useState("waiting"); // waiting | paid | bad | error
  const [error, setError] = useState("");
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!reference) return undefined;
    let alive = true;
    let timer = null;
    let tries = 0;

    const poll = async () => {
      try {
        const d = await api.get(`/api/payments/checkout/${encodeURIComponent(reference)}`);
        if (!alive) return;
        const p = d.payment || null;
        setPayment(p);
        if (p && p.status === "paid") {
          setState("paid");
          doneRef.current?.(p);
          return;
        }
        if (p && BAD_STATUSES.includes(p.status)) {
          setState("bad");
          return;
        }
        tries += 1;
        if (tries >= 200) {
          setState("bad");
          return;
        }
        timer = setTimeout(poll, 3000);
      } catch (e) {
        if (!alive) return;
        setError(e.message);
        tries += 1;
        if (tries < 3) timer = setTimeout(poll, 3000);
        else setState("error");
      }
    };

    poll();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [reference]);

  const paid = state === "paid";
  const bad = state === "bad" || state === "error";
  const amountLabel = formatPrice(payment?.amount ?? amount, payment?.currency || currency);

  return (
    <div className="pay-overlay" role="dialog" aria-modal="true">
      <div className="pay-overlay-card">
        {paid ? (
          <>
            <div className="pay-icon pay-icon-ok" aria-hidden="true">✓</div>
            <h2>Greiðsla tókst</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              {label ? `${label} · ` : ""}{amountLabel}
            </p>
            <button className="btn btn-primary" onClick={onClose}>Loka</button>
          </>
        ) : bad ? (
          <>
            <div className="pay-icon pay-icon-err" aria-hidden="true">!</div>
            <h2>{state === "error" ? "Gat ekki staðfest greiðslu" : "Greiðslan tókst ekki"}</h2>
            <p className="muted" style={{ marginTop: 0 }}>{error || "Vinsamlegast reyndu aftur."}</p>
            <button className="btn btn-primary" onClick={onClose}>Loka</button>
          </>
        ) : (
          <>
            <div className="pay-spinner" aria-hidden="true" />
            <h2>Bíð eftir greiðslu…</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Greiðslusíðan er opnuð í nýjum glugga. Ljúktu greiðslunni þar — þessi síða uppfærist sjálfkrafa.
            </p>
            <p className="muted" style={{ marginTop: -6 }}>
              {label ? `${label} · ` : ""}{amountLabel}
            </p>
            <div className="row" style={{ justifyContent: "center", gap: 10, marginTop: 12 }}>
              {url && (
                <a className="btn btn-outline btn-sm" href={url} target="_blank" rel="noreferrer">
                  Opna greiðslusíðu
                </a>
              )}
              <button className="btn btn-outline btn-sm" onClick={onClose}>Hætta við</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
