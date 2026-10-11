const { Router } = require("express");
const db = require("../db/pool");
const { asyncHandler, err } = require("../middleware/http");
const { logAdminAction } = require("../utils/adminLog");

const router = Router();

// POST /api/contact { name, email, subject, message } -> public contact form.
// Stored in the admin inbox; there is no SMTP integration yet.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name || "").trim().slice(0, 120);
    const email = String(req.body?.email || "").trim().slice(0, 255);
    const subject = String(req.body?.subject || "").trim().slice(0, 200);
    const message = String(req.body?.message || "").trim().slice(0, 5000);

    if (!email) throw err("Email is required", 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw err("Invalid email", 400);
    if (message.length < 5) throw err("Message is too short", 400);

    const ins = await db.query(
      `INSERT INTO contact_messages (name, email, subject, message, ip)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [name, email, subject, message, req.ip]
    );
    await logAdminAction({
      adminId: null,
      action: "contact.new",
      targetType: "message",
      targetId: ins.rows[0].id,
      data: { email, subject },
      ip: req.ip,
    });

    res.status(201).json({ ok: true, id: ins.rows[0].id });
  })
);

module.exports = router;
