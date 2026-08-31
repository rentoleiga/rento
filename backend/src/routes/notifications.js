const { Router } = require("express");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/http");

const router = Router();

router.get(
  "/",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT id, type, title, body, data, read_at, created_at
       FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json({ notifications: rows });
  })
);

router.get(
  "/unread-count",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT count(*)::int AS unread FROM notifications
       WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.id]
    );
    res.json({ unread: rows[0].unread });
  })
);

router.put(
  "/:id/read",
  authRequired,
  asyncHandler(async (req, res) => {
    await db.query(
      `UPDATE notifications SET read_at = now()
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  })
);

router.put(
  "/read-all",
  authRequired,
  asyncHandler(async (req, res) => {
    await db.query(
      `UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.id]
    );
    res.json({ ok: true });
  })
);

module.exports = router;