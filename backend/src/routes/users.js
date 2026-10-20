const { Router } = require("express");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler, err } = require("../middleware/http");
const { publicUser, publicListing } = require("../utils/helpers");

const router = Router();

// Referral link + count for the logged-in user.
router.get(
  "/me/referrals",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      "SELECT referral_code FROM users WHERE id = $1",
      [req.user.id]
    );
    let code = rows[0]?.referral_code;
    if (!code) {
      code = Math.random().toString(36).slice(2, 10).toUpperCase();
      await db.query("UPDATE users SET referral_code = $1 WHERE id = $2", [code, req.user.id]);
    }
    const cnt = await db.query(
      "SELECT count(*)::int AS n FROM referrals WHERE referrer_id = $1",
      [req.user.id]
    );
    res.json({
      code,
      link: `https://www.rento.is/register?ref=${encodeURIComponent(code)}`,
      referrals: cnt.rows[0].n,
    });
  })
);

// Mock phone verification: accepts the demo code 1234.
router.post(
  "/me/verify-phone",
  authRequired,
  asyncHandler(async (req, res) => {
    if (String(req.body?.code || "") !== "1234") {
      throw err("Rangur staðfestingarkóði (prufa: 1234)", 400);
    }
    await db.query("UPDATE users SET phone_verified = TRUE WHERE id = $1", [req.user.id]);
    res.json({ ok: true, phoneVerified: true });
  })
);

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
    const [ownerStats, renterStats] = await Promise.all([
      db.query(
        `SELECT count(*)::int AS total,
                count(*) FILTER (WHERE status = 'completed')::int AS completed,
                count(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
           FROM bookings WHERE owner_id = $1`,
        [user.id]
      ),
      db.query(
        `SELECT count(*)::int AS total,
                count(*) FILTER (WHERE status = 'completed')::int AS completed
           FROM bookings WHERE renter_id = $1`,
        [user.id]
      ),
    ]);
    res.json({
      user: publicUser(user),
      listings: listings.map((l) => publicListing(l)),
      stats: {
        memberSince: user.created_at,
        ownerBookings: ownerStats.rows[0],
        renterBookings: renterStats.rows[0],
        responseRate: Number(user.response_rate || 0),
        responseTime: Number(user.response_time || 0),
      },
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
