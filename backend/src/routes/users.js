const { Router } = require("express");
const db = require("../db/pool");
const { asyncHandler, err } = require("../middleware/http");
const { publicUser, publicListing, paginate } = require("../utils/helpers");

const router = Router();

// Public profile
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT * FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) throw err("User not found", 404);
    const user = rows[0];
    const { rows: listings } = await db.query(
      `SELECT * FROM listings WHERE owner_id = $1 AND status = 'published' ORDER BY featured DESC, rating DESC LIMIT 12`,
      [user.id]
    );
    res.json({
      user: publicUser(user),
      listings: listings.map((l) => publicListing(l)),
    });
  })
);

// Favorites of the current user
router.get(
  "/:id/favorites",
  asyncHandler(async (req, res) => {
    throw err("Use /api/favorites instead", 400);
  })
);

module.exports = router;