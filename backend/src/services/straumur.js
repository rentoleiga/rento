const crypto = require("crypto");
const config = require("../config");

// Straumur Hosted Checkout + Payment Gateway helper.
// Amounts are sent in minor units: all supported currencies use 2 decimals,
// so ISK 1.290 becomes 129000.

function toMinor(amount) {
  return Math.round(Number(amount || 0) * 100);
}

function isEnabled() {
  return !!config.straumur.enabled;
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${config.straumur.apiBase}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-api-key": config.straumur.apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data.message || data.error || data.title || `Straumur villa (${res.status})`;
    const err = new Error(message);
    err.status = 502;
    err.details = data;
    throw err;
  }
  return data;
}

async function createCheckout({
  amount,
  currency = "ISK",
  reference,
  returnUrl,
  abandonUrl,
  culture = "is",
  shopperContact,
  items,
}) {
  const body = {
    amount: toMinor(amount),
    currency,
    returnUrl,
    reference,
    terminalIdentifier: config.straumur.terminalId,
    culture,
    ...(config.straumur.themeKey ? { themeKey: config.straumur.themeKey } : {}),
    ...(abandonUrl ? { abandonUrl } : {}),
    ...(shopperContact ? { shopperContact } : {}),
    ...(items && items.length
      ? {
          items: items.map((item) => ({
            name: String(item.name || "Rentó").slice(0, 500),
            amount: toMinor(item.amount),
            ...(item.quantity ? { quantity: item.quantity } : {}),
          })),
        }
      : {}),
  };
  return request("/hostedcheckout", { method: "POST", body });
}

async function getCheckoutStatus(checkoutReference) {
  return request(`/hostedcheckout/status/${encodeURIComponent(checkoutReference)}`);
}

async function refund({ reference, payfacReference, amount, currency = "ISK" }) {
  return request("/modification/refund", {
    method: "POST",
    body: {
      reference,
      payfacReference,
      amount: toMinor(amount),
      currency,
      refundReason: "CUSTOMER REQUEST",
    },
  });
}

// Payment webhook HMAC: SHA256 over these values joined by ":" in this exact
// order (null -> empty string), keyed with the hex HMAC key.
function hmacSignature(payload, keyHex = config.straumur.hmacKey) {
  let hex = String(keyHex || "").trim();
  if (hex.length % 2) hex += "0";
  const key = Buffer.from(hex, "hex");
  const message = [
    payload.checkoutReference,
    payload.payfacReference,
    payload.merchantReference,
    payload.amount,
    payload.currency,
    payload.reason,
    payload.success,
  ]
    .map((v) => (v == null ? "" : String(v)))
    .join(":");
  return crypto.createHmac("sha256", key).update(message, "utf8").digest("base64");
}

function verifyWebhookSignature(payload) {
  if (!config.straumur.hmacKey) return false;
  const expected = hmacSignature(payload);
  const received = String(payload.hmacSignature || "");
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifyWebhookAuthorization(header) {
  const expected = String(config.straumur.webhookApiKey || "");
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(String(header || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = {
  toMinor,
  isEnabled,
  createCheckout,
  getCheckoutStatus,
  refund,
  hmacSignature,
  verifyWebhookSignature,
  verifyWebhookAuthorization,
};
