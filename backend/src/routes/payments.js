const { Router } = require("express");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler, err } = require("../middleware/http");

const router = Router();

const SELECT = `SELECT p.id, p.user_id, p.kind, p.reference_id, p.package_id, p.amount, p.currency,
                       p.status, p.promo_code, p.discount, p.created_at,
                       l.title AS listing_title, l.slug AS listing_slug
                  FROM payments p
                  LEFT JOIN listings l ON l.id = p.reference_id`;

// GET /api/payments/mine -> purchases made by the logged-in user.
router.get(
  "/mine",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `${SELECT} WHERE p.user_id = $1 ORDER BY p.created_at DESC LIMIT 200`,
      [req.user.id]
    );
    res.json({ payments: rows });
  })
);

// GET /api/payments/:id -> single receipt (owner or admin).
router.get(
  "/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(`${SELECT} WHERE p.id = $1`, [req.params.id]);
    if (!rows.length) throw err("Payment not found", 404);
    if (rows[0].user_id !== req.user.id && req.user.role !== "admin") {
      throw err("Payment not found", 404);
    }
    res.json({ payment: rows[0], buyer: req.user.role === "admin" ? rows[0].user_id : req.user.id });
  })
);

module.exports = router;
