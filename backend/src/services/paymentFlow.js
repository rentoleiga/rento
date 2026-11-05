const crypto = require("crypto");
const db = require("../db/pool");
const config = require("../config");
const straumur = require("./straumur");
const { notify } = require("../utils/notify");

const PROMO_TIERS = { silver: "featured", gold: "gold", platinum: "platinum" };
const PROMO_DAYS = { silver: 7, gold: 14, platinum: 30 };

function newReference(paymentId) {
  return `RENTO-${paymentId}-${crypto.randomBytes(8).toString("hex")}`;
}

async function consumePromoCode(client, code) {
  if (!code) return;
  await client.query(
    "UPDATE promo_codes SET uses = uses + 1 WHERE upper(code) = upper($1)",
    [code]
  );
}

// Creates a pending payment and either redirects to Straumur Hosted Checkout
// or, when Straumur is not configured (local dev), fulfils it immediately.
async function createPurchase({
  userId,
  kind,
  referenceId = null,
  packageId = "",
  amount,
  currency = "ISK",
  promoCode = "",
  discount = 0,
  metadata = {},
  items = [],
}) {
  const enabled = straumur.isEnabled();
  const allowMock =
    !enabled &&
    (process.env.PAYMENTS_MOCK === "true" || process.env.NODE_ENV === "development");
  if (!enabled && !allowMock) {
    const e = new Error("Greiðslukerfið er ekki stillt");
    e.status = 503;
    throw e;
  }

  const value = Math.max(0, Math.round(Number(amount) || 0));
  const { rows } = await db.query(
    `INSERT INTO payments
       (user_id, kind, reference_id, package_id, amount, currency, status,
        promo_code, discount, provider, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$10)
     RETURNING *`,
    [
      userId,
      kind,
      referenceId,
      packageId,
      value,
      currency,
      promoCode,
      discount,
      enabled ? "straumur" : "mock",
      JSON.stringify(metadata),
    ]
  );
  let payment = rows[0];

  // Free purchase (100% promo) or local/mock mode: fulfil right away.
  if (!enabled || value === 0) {
    const paid = await applyPaidPayment(payment.id, {
      providerReference: enabled ? "free" : "mock_payment",
    });
    return { payment: paid.payment || payment, redirect: null, paid: true };
  }

  const reference = newReference(payment.id);
  const webOrigin = String(config.webOrigin || "https://www.rento.is").replace(/\/$/, "");
  const returnUrl = `${webOrigin}/payment/return?ref=${encodeURIComponent(reference)}`;
  const abandonUrl = `${returnUrl}&status=cancelled`;

  const user = await db.query("SELECT email, language FROM users WHERE id = $1", [userId]);
  const shopper = user.rows[0] || {};

  try {
    const checkout = await straumur.createCheckout({
      amount: value,
      currency,
      reference,
      returnUrl,
      abandonUrl,
      culture: shopper.language === "en" ? "en" : "is",
      shopperContact: shopper.email || undefined,
      items: items.length ? items : [{ name: metadata.description || "Rentó", amount: value }],
    });
    const updated = await db.query(
      `UPDATE payments
          SET merchant_reference = $2, checkout_reference = $3, checkout_url = $4,
              provider_status = 'created', metadata = metadata || $5::jsonb
        WHERE id = $1
        RETURNING *`,
      [
        payment.id,
        reference,
        checkout.checkoutReference || "",
        checkout.url || "",
        JSON.stringify({ returnUrl, abandonUrl }),
      ]
    );
    payment = updated.rows[0];
    return { payment, redirect: checkout.url, paid: false };
  } catch (e) {
    await db.query(
      "UPDATE payments SET status = 'failed', failed_reason = $2 WHERE id = $1",
      [payment.id, String(e.message || "checkout_failed").slice(0, 300)]
    );
    throw e;
  }
}

// Marks a payment as paid and grants what was bought. Idempotent: only the
// first call for a pending payment performs the fulfilment.
async function applyPaidPayment(paymentId, { providerReference = "", checkoutReference = "" } = {}) {
  const client = await db.connect();
  let notification = null;
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT * FROM payments WHERE id = $1 FOR UPDATE", [
      paymentId,
    ]);
    if (!rows.length) {
      await client.query("ROLLBACK");
      return { ok: false, notFound: true };
    }
    const payment = rows[0];
    if (["paid", "refunded", "refund_pending"].includes(payment.status)) {
      await client.query("COMMIT");
      return { ok: true, already: true, payment };
    }

    const meta = payment.metadata || {};
    let fulfillmentError = "";

    if (payment.kind === "slot") {
      const count = Math.max(1, Math.min(10, Number(meta.count) || 1));
      const per = Math.round(Number(payment.amount) / count);
      for (let i = 0; i < count; i += 1) {
        await client.query(
          `INSERT INTO listing_slots (user_id, package_id, amount)
           VALUES ($1, $2, $3)`,
          [payment.user_id, payment.package_id || "single", per]
        );
      }
      await consumePromoCode(client, payment.promo_code);
    } else if (payment.kind === "promotion") {
      const listingId = Number(payment.reference_id);
      const tierIn = payment.package_id;
      const tier = PROMO_TIERS[tierIn];
      const days = PROMO_DAYS[tierIn] || 0;
      const found = await client.query(
        "SELECT id, promotion_tier, promotion_until FROM listings WHERE id = $1",
        [listingId]
      );
      if (!found.rows.length || !tier) {
        fulfillmentError = "listing_not_found";
      } else {
        const listing = found.rows[0];
        const extend =
          listing.promotion_tier === tier &&
          listing.promotion_until &&
          new Date(listing.promotion_until) > new Date();
        await client.query(
          `UPDATE listings
              SET promotion_tier = $1,
                  promotion_until = ${extend ? "promotion_until" : "now()"} + make_interval(days => $2),
                  promotion_started_at = ${extend ? "COALESCE(promotion_started_at, now())" : "now()"},
                  promotion_reminder_sent_at = NULL,
                  updated_at = now()
            WHERE id = $3`,
          [tier, days, listingId]
        );
        notification = { type: "promotion_paid", userId: payment.user_id, listingId, tierIn, days };
      }
      await consumePromoCode(client, payment.promo_code);
    } else if (payment.kind === "booking") {
      const bookingId = Number(payment.reference_id);
      const found = await client.query(
        `SELECT b.*, l.title AS listing_title
           FROM bookings b JOIN listings l ON l.id = b.listing_id
          WHERE b.id = $1`,
        [bookingId]
      );
      const b = found.rows[0];
      if (!b) {
        fulfillmentError = "booking_not_found";
      } else if (b.payment_status === "paid") {
        // already processed
      } else if (b.status !== "approved") {
        fulfillmentError = "booking_not_payable";
      } else {
        await client.query(
          `INSERT INTO transactions
             (booking_id, payer_id, receiver_id, amount, platform_fee, owner_amount,
              currency, status, provider_reference, payfac_reference, checkout_reference)
           VALUES ($1,$2,$3,$4,0,$4,$5,'paid',$6,$6,$7)`,
          [
            b.id,
            b.renter_id,
            b.owner_id,
            b.total,
            b.currency,
            providerReference || "straumur",
            checkoutReference || payment.checkout_reference || "",
          ]
        );
        await client.query(
          "UPDATE bookings SET status = 'active', payment_status = 'paid', updated_at = now() WHERE id = $1",
          [b.id]
        );
        notification = {
          type: "booking_paid",
          userId: b.owner_id,
          bookingId: b.id,
          title: b.listing_title,
          total: b.total,
          currency: b.currency,
        };
      }
    }

    const result = await client.query(
      `UPDATE payments
          SET status = 'paid',
              paid_at = now(),
              provider_reference = $2,
              checkout_reference = COALESCE(NULLIF($3, ''), checkout_reference),
              provider_status = CASE WHEN $4 = '' THEN 'paid' ELSE $4 END,
              failed_reason = CASE WHEN $4 = '' THEN failed_reason ELSE $4 END
        WHERE id = $1
        RETURNING *`,
      [payment.id, providerReference || "straumur", checkoutReference || "", fulfillmentError]
    );
    await client.query("COMMIT");

    if (notification && notification.type === "booking_paid") {
      await notify(
        notification.userId,
        "payment_success",
        "Greiðsla móttekin",
        `Greiðsla að upphæð ${notification.total} ${notification.currency} barst fyrir „${notification.title}“.`,
        { bookingId: notification.bookingId }
      );
    }

    return { ok: true, payment: result.rows[0], fulfillmentError };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function findByMerchantReference(reference) {
  if (!reference) return null;
  const { rows } = await db.query("SELECT * FROM payments WHERE merchant_reference = $1", [
    String(reference),
  ]);
  return rows[0] || null;
}

async function getByReference(reference, userId) {
  const { rows } = await db.query(
    `SELECT p.*, COALESCE(l.title, bl.title) AS listing_title,
            COALESCE(l.slug, bl.slug) AS listing_slug
       FROM payments p
       LEFT JOIN listings l ON l.id = p.reference_id AND p.kind = 'promotion'
       LEFT JOIN bookings b ON b.id = p.reference_id AND p.kind = 'booking'
       LEFT JOIN listings bl ON bl.id = b.listing_id
      WHERE p.merchant_reference = $1`,
    [String(reference)]
  );
  const payment = rows[0];
  if (!payment) return null;
  if (userId && payment.user_id !== userId) return null;
  return payment;
}

async function markDeclined(reference, reason) {
  if (!reference) return;
  await db.query(
    `UPDATE payments
        SET failed_reason = $2, provider_status = 'declined'
      WHERE merchant_reference = $1 AND status = 'pending'`,
    [String(reference), String(reason || "").slice(0, 300)]
  );
}

async function applyRefund(originalPayfacReference, success, reason) {
  if (!originalPayfacReference) return;
  const done = String(success) === "true";
  await db.query(
    `UPDATE payments
        SET status = $2,
            refunded_at = CASE WHEN $2 = 'refunded' THEN now() ELSE refunded_at END,
            provider_status = $3,
            failed_reason = CASE WHEN $2 = 'refunded' THEN failed_reason ELSE $4 END
      WHERE provider_reference = $1
        AND status IN ('paid', 'refund_pending')`,
    [
      String(originalPayfacReference),
      done ? "refunded" : "paid",
      done ? "refunded" : "refund_failed",
      done ? null : String(reason || "refund_failed").slice(0, 300),
    ]
  );
}

// Asks Straumur for the checkout status and reconciles a pending payment.
// Used by the return page as a fallback when the webhook is delayed.
async function refreshCheckoutStatus(payment) {
  if (!payment || payment.status !== "pending" || !payment.checkout_reference) return payment;
  if (!straumur.isEnabled()) return payment;
  const status = await straumur.getCheckoutStatus(payment.checkout_reference);
  if (status.status === "Completed") {
    const paid = await applyPaidPayment(payment.id, {
      providerReference: status.payfacReference || "",
      checkoutReference: payment.checkout_reference,
    });
    return paid.payment || payment;
  }
  if (status.status === "Expired") {
    const { rows } = await db.query(
      `UPDATE payments
          SET status = 'expired', provider_status = 'expired'
        WHERE id = $1 AND status = 'pending'
        RETURNING *`,
      [payment.id]
    );
    return rows[0] || payment;
  }
  return payment;
}

module.exports = {
  createPurchase,
  applyPaidPayment,
  findByMerchantReference,
  getByReference,
  markDeclined,
  applyRefund,
  refreshCheckoutStatus,
};
