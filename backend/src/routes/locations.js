const { Router } = require("express");
const db = require("../db/pool");
const { asyncHandler } = require("../middleware/http");

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT id, slug, city, region, municipality, latitude, longitude,
              airport_name, airport_distance,
(SELECT count(*)::int FROM listings l
                WHERE l.status='published'
                  AND lower(l.city) = lower(locations.city)) AS listing_count
       FROM locations
       ORDER BY listing_count DESC, city`
    );
    res.json({
      locations: rows.map((r) => ({
        ...r,
        latitude: r.latitude === null ? null : Number(r.latitude),
        longitude: r.longitude === null ? null : Number(r.longitude),
      })),
    });
  })
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT * FROM locations WHERE slug = $1`,
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Location not found" });
    const loc = rows[0];
    const { rows: listings } = await db.query(
      `SELECT l.*, c.slug AS category_slug,
              COALESCE(ct.name, '') AS category_name
       FROM listings l
       LEFT JOIN categories c ON c.id = l.category_id
       LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language = 'en'
       WHERE l.status='published' AND lower(l.city) = lower($1)
       ORDER BY l.featured DESC, l.rating DESC`,
      [loc.city]
    );
    res.json({
      location: {
        id: loc.id,
        slug: loc.slug,
        city: loc.city,
        region: loc.region,
        municipality: loc.municipality,
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude),
        airportName: loc.airport_name,
        airportDistance: Number(loc.airport_distance),
      },
      listingCount: listings.length,
      listings,
    });
  })
);

module.exports = router;