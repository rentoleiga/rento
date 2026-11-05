const { Router } = require("express");
const db = require("../db/pool");
const { asyncHandler, err } = require("../middleware/http");
const { optionalAuth } = require("../middleware/auth");

const router = Router();

const clip = (v, n) => String(v == null ? "" : v).slice(0, n);

// POST /api/errors -> store a client-side error report.
router.post(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const message = clip(req.body?.message, 2000).trim();
    if (!message) throw err("Message is required", 400);

    const ip = req.ip || "";
    const recent = await db.query(
      `SELECT count(*)::int AS n FROM error_logs
        WHERE ip = $1 AND created_at > now() - interval '1 minute'`,
      [ip]
    );
    if (recent.rows[0].n >= 30) return res.status(429).json({ error: "Too many reports" });

    await db.query(
      `INSERT INTO error_logs (source, message, stack, url, user_id, user_agent, ip, context)
       VALUES ('frontend', $1, $2, $3, $4, $5, $6, $7)`,
      [
        message,
        clip(req.body?.stack, 8000),
        clip(req.body?.url, 500),
        req.user ? req.user.id : null,
        clip(req.headers["user-agent"], 300),
        ip,
        JSON.stringify(req.body?.context || {}),
      ]
    );
    res.status(201).json({ ok: true });
  })
);

module.exports = router;
