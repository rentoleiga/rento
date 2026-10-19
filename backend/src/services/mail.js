const config = require("../config");

// Sends email through the Resend HTTP API when RESEND_API_KEY + MAIL_FROM are
// configured. Without them the caller gets { skipped: true } and the message
// is not delivered - callers must handle that (e.g. admin fallback).
async function sendMail({ to, subject, html, text }) {
  if (!config.resendApiKey || !config.mailFrom) {
    return { skipped: true, reason: "mail_not_configured" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.resendApiKey}`,
    },
    body: JSON.stringify({
      from: config.mailFrom,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Email send failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return { ok: true };
}

module.exports = { sendMail };
