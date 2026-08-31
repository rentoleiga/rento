const { Router } = require("express");
const db = require("../db/pool");
const { optionalAuth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/http");
const { publicListing } = require("../utils/helpers");

const router = Router();

const RENTED_SQL = `(SELECT count(*)::int FROM bookings b
   WHERE b.listing_id = v.id AND b.status IN ('completed','active'))`;

async function annotateFavorites(rows, userId) {
  const out = rows.map((r) => publicListing(r));
  if (userId) {
    const { rows: fr } = await db.query(
      `SELECT listing_id FROM favorites WHERE user_id = $1`,
      [userId]
    );
    const set = new Set(fr.map((r) => r.listing_id));
    out.forEach((l) => {
      l.isFavorite = set.has(l.id);
    });
  }
  return out;
}

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const [platinum, popular, newest] = await Promise.all([
      db.query(
        `SELECT v.*
         FROM v_listing_search v
         WHERE v.promotion_tier = 'platinum'
           AND v.promotion_until IS NOT NULL
           AND v.promotion_until > now()
         ORDER BY v.rating DESC, v.review_count DESC
         LIMIT 8`
      ),
      db.query(
        `SELECT v.*, ${RENTED_SQL} AS rented_count
         FROM v_listing_search v
         ORDER BY v.view_count + 4 * v.favorite_count + 10 * (${RENTED_SQL}) + 20 * v.rating DESC
         LIMIT 8`
      ),
      db.query(
        `SELECT v.*
         FROM v_listing_search v
         ORDER BY v.created_at DESC
         LIMIT 8`
      ),
    ]);

    // Drop duplicates from the newest list if already shown as platinum/popular
    const seen = new Set();
    const dedupe = (rows) => {
      const keep = [];
      for (const r of rows) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        keep.push(r);
      }
      return keep;
    };
    platinum.rows.forEach((r) => seen.add(r.id));
    const pop = dedupe(popular.rows.filter((r) => !seen.has(r.id)));
    const newer = dedupe(newest.rows);

    res.json({
      platinum: await annotateFavorites(platinum.rows, req.user && req.user.id),
      popular: await annotateFavorites(pop, req.user && req.user.id),
      newest: await annotateFavorites(newer, req.user && req.user.id),
    });
  })
);

module.exports = router;