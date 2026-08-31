const { Router } = require("express");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/http");
const { publicListing } = require("../utils/helpers");

const router = Router();

router.get(
  "/",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT l.*, f.created_at AS favorited_at
       FROM favorites f
       JOIN listings l ON l.id = f.listing_id
       WHERE f.user_id = $1 AND l.status = 'published'
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json({ favorites: rows.map((r) => publicListing(r)) });
  })
);

module.exports = router;