import React, { useEffect, useRef, useState } from "react";
import { api, formatPrice } from "../api";

const BAD_STATUSES = ["failed", "expired", "refunded"];

export default function PaymentOverlay({ reference, amount, currency = "ISK", label, windowRef, onDone, onClose }) {
  const [payment, setPayment] = useState(null);
  const [state, setState] = useState("waiting"); // waiting | paid | bad | error | abandoned
  const [error, setError] = useState("");
  const doneRef = useRef(onDone);
  const closeRef = useRef(onClose);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (state !== "paid") return undefined;
    const timer = setTimeout(() => closeRef.current?.(), 2200);
    return () => clearTimeout(timer);
  }, [state]);

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
        // The payment tab may have been closed or navigated back to about:blank.
        // Keep polling (the payment may still have gone through) but surface it.
        const win = windowRef?.current;
        if (win) {
          let lost = false;
          if (win.closed) lost = true;
          else {
            try {
              if (win.location.href === "about:blank") lost = true;
            } catch {
              // cross-origin: the tab is still on Straumur
            }
          }
          if (lost) setState("abandoned");
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
  const abandoned = state === "abandoned";
  const bad = state === "bad" || state === "error" || abandoned;
  const amountLabel = formatPrice(payment?.amount ?? amount, payment?.currency || currency);
  const title = abandoned
    ? "Greiðslusíða var lokuð"
    : state === "error"
      ? "Gat ekki staðfest greiðslu"
      : "Greiðslan tókst ekki";
  const message = abandoned
    ? "Ef þú kláraðir greiðsluna birtist hún hér eftir nokkrar sekúndur. Annars skaltu reyna aftur."
    : error || "Vinsamlegast reyndu aftur.";

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
          </>
        ) : bad ? (
          <>
            <button className="pay-overlay-close" aria-label="Loka" onClick={onClose}>×</button>
            <div className="pay-icon pay-icon-err" aria-hidden="true">!</div>
            <h2>{title}</h2>
            <p className="muted" style={{ marginTop: 0 }}>{message}</p>
          </>
        ) : (
          <>
            <div className="pay-spinner" aria-hidden="true" />
            <h2>Bíð eftir greiðslu…</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Greiðslusíðan er opnuð í nýjum flipa. Ljúktu greiðslunni þar — hún fer sjálfkrafa í gegn hér.
            </p>
            <p className="muted" style={{ marginTop: -6 }}>
              {label ? `${label} · ` : ""}{amountLabel}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
