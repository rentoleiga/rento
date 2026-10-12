const { Router } = require("express");
const db = require("../db/pool");
const { asyncHandler, err } = require("../middleware/http");
const { optionalAuth } = require("../middleware/auth");

const router = Router();

const SID_RE = /^[A-Za-z0-9-]{8,64}$/;

// POST /api/track { sid, path } -> anonymous visit heartbeat.
// One row per event; the client throttles navigation events and sends a
// heartbeat every 60s so "online now" (last 5 minutes) stays accurate.
router.post(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const sid = String(req.body?.sid || "").trim();
    const path = String(req.body?.path || "/").slice(0, 300);
    if (!SID_RE.test(sid)) throw err("Invalid session id", 400);

    // Server-side throttle: max one event per session every 10 seconds.
    const recent = await db.query(
      `SELECT id FROM page_visits
       WHERE session_id = $1 AND created_at > now() - interval '10 seconds'
       LIMIT 1`,
      [sid]
    );
    if (recent.rows.length) return res.json({ ok: true, throttled: true });

    await db.query(
      `INSERT INTO page_visits (session_id, path, user_id, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        sid,
        path,
        req.user ? req.user.id : null,
        req.ip,
        String(req.headers["user-agent"] || "").slice(0, 300),
      ]
    );

    res.json({ ok: true });
  })
);

module.exports = router;
