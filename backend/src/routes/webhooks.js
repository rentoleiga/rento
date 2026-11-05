const { Router } = require("express");
const config = require("../config");
const straumur = require("../services/straumur");
const flow = require("../services/paymentFlow");
const { asyncHandler } = require("../middleware/http");
const { logError } = require("../utils/errorLog");

const router = Router();

// POST /api/webhooks/straumur
// Straumur delivers payment events here. We validate the webhook API key in
// the Authorization header and the HMAC signature, then reconcile the payment.
router.post(
  "/straumur",
  asyncHandler(async (req, res) => {
    if (!config.straumur.webhookApiKey || !config.straumur.hmacKey) {
      return res.status(503).json({ error: "Webhook is not configured" });
    }
    if (!straumur.verifyWebhookAuthorization(req.headers.authorization)) {
      return res.status(401).json({ error: "Invalid authorization" });
    }
    const payload = req.body || {};
    if (!straumur.verifyWebhookSignature(payload)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    try {
      const event = payload.additionalData?.eventType;
      if (event === "Authorization") {
        if (String(payload.success) === "true") {
          const payment = await flow.findByMerchantReference(payload.merchantReference);
          if (payment) {
            const expectedMinor = Math.round(Number(payment.amount) * 100);
            const receivedMinor = Number(payload.amount);
            const currencyOk =
              String(payload.currency || "").toUpperCase() ===
              String(payment.currency || "ISK").toUpperCase();
            if (!currencyOk || !Number.isFinite(receivedMinor) || receivedMinor !== expectedMinor) {
              await logError({
                source: "backend",
                message: `Straumur amount mismatch: expected ${expectedMinor} ${payment.currency}, got ${payload.amount} ${payload.currency}`,
                url: "webhook:straumur",
                context: { paymentId: payment.id, merchantReference: payload.merchantReference },
              });
              return res.status(200).json({ ok: true, ignored: "amount_mismatch" });
            }
            await flow.applyPaidPayment(payment.id, {
              providerReference: payload.payfacReference,
              checkoutReference: payload.checkoutReference,
            });
          }
        } else {
          await flow.markDeclined(payload.merchantReference, payload.reason);
        }
      } else if (event === "Refund") {
        await flow.applyRefund(
          payload.additionalData?.originalPayfacReference,
          payload.success,
          payload.reason
        );
      }
    } catch (e) {
      console.error("straumur webhook error:", e);
      return res.status(500).json({
        error: e.message,
        code: e.code || null,
        detail: e.detail || null,
        constraint: e.constraint || null,
      });
    }

    // Straumur treats only HTTP 200 as success.
    res.status(200).json({ ok: true });
  })
);

module.exports = router;
