const db = require("../db/pool");

// Persist application errors so admins can see them in the panel.
async function logError({ source = "backend", message, stack, url, userId, userAgent, ip, context } = {}) {
  try {
    await db.query(
      `INSERT INTO error_logs (source, message, stack, url, user_id, user_agent, ip, context)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        source,
        String(message || "Unknown error").slice(0, 2000),
        String(stack || "").slice(0, 8000),
        String(url || "").slice(0, 500),
        userId || null,
        String(userAgent || "").slice(0, 300),
        String(ip || "").slice(0, 60),
        JSON.stringify(context || {}),
      ]
    );
  } catch (err) {
    console.error("error_log insert failed:", err.message);
  }
}

module.exports = { logError };
