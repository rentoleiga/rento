const { Router } = require("express");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/http");

const router = Router();

// GET /api/payments/mine -> purchases made by the logged-in user.
router.get(
  "/mine",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT p.id, p.kind, p.reference_id, p.package_id, p.amount, p.currency,
              p.status, p.created_at,
              l.title AS listing_title, l.slug AS listing_slug
         FROM payments p
         LEFT JOIN listings l ON l.id = p.reference_id
        WHERE p.user_id = $1
        ORDER BY p.created_at DESC
        LIMIT 200`,
      [req.user.id]
    );
    res.json({ payments: rows });
  })
);

module.exports = router;
