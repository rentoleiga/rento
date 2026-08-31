const { Router } = require("express");
const db = require("../db/pool");
const { optionalAuth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/http");

const router = Router();

// Market-rate fallback (ISK/day) per subcategory slug. Used when the platform
// has no live listings in a category so the calculator still gives a sensible
// starting price. Values reflect typical Iceland rental rates.
const DEFAULTS = {
  cars: 12000, "4x4": 52000, campervans: 45000, motorhomes: 60000,
  motorcycles: 18000, scooters: 6000, trailers: 6000, bikes: 4500, "e-bikes": 9500,
  tents: 3500, "sleeping-bags": 1500, "camping-furniture": 2500, "camping-kitchens": 3000, stoves: 2000,
  "outdoor-equipment": 4000,
  "hiking-equipment": 3000, "fishing-equipment": 4000, kayaks: 5000, sup: 4500,
  "snow-equipment": 5500, "climbing-equipment": 3500,
  "baby-seats": 1500, strollers: 2000, "baby-beds": 2500, "car-seats": 1500, "child-carriers": 1800,
  "power-tools": 4000, "construction-equipment": 9000, generators: 3000, ladders: 2500,
  "cleaning-equipment": 3000, "garden-equipment": 3000,
  tables: 1500, chairs: 800, speakers: 6000, lighting: 4000, projectors: 7000,
  cameras: 8000, lenses: 4000, drones: 9000, audio: 5000,
  "lawn-mowers": 5500, "garden-tools": 3000, grills: 3500, "hedge-trimmers": 3500, chainsaws: 4000,
  "pressure-washers": 6000, "carpet-cleaners": 5000, vacuums: 3500, "floor-scrubbers": 6000,
  laptops: 9000, printers: 2500, whiteboards: 1000,
  golf: 5000, "ball-sports": 3000, fitness: 4000, skateboards: 2500,
};

function demandStars(listingsCount, avgViews) {
  if (!listingsCount) return 3;
  if (avgViews >= 800) return 5;
  if (avgViews >= 500) return 4;
  if (avgViews >= 250) return 3;
  if (avgViews >= 100) return 2;
  return 1;
}

// Suggested occupancy % derived from demand (1-5 stars).
function suggestedOccupancy(stars) {
  return Math.min(90, 20 + stars * 12);
}

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT
         c.id, c.slug, c.parent_id,
         cat.slug AS cat_slug, cat.icon AS cat_icon,
         COALESCE(ct.name, c.slug) AS name,
         COALESCE(catt.name, cat.slug) AS cat_name,
         COUNT(l.id)::int AS listings_count,
         COALESCE(ROUND(AVG(l.price_daily))::int, 0) AS avg_daily,
         COALESCE(ROUND(AVG(l.view_count))::int, 0) AS avg_views
       FROM categories c
       JOIN categories cat ON cat.id = c.parent_id
       LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language = 'en'
       LEFT JOIN category_translations catt ON catt.category_id = cat.id AND catt.language = 'en'
       LEFT JOIN listings l
         ON l.subcategory_id = c.id
        AND l.status = 'published'
        AND l.verification_status IN ('approved','verified')
       WHERE c.parent_id IS NOT NULL
       GROUP BY c.id, c.slug, c.parent_id, cat.slug, cat.icon, cat.sort_order, ct.name, catt.name
       ORDER BY cat.sort_order, c.slug`
    );

    const byCat = new Map();
    const subcats = [];
    for (const r of rows) {
      const listingsCount = Number(r.listings_count) || 0;
      const avgDaily = Number(r.avg_daily) || 0;
      const avgViews = Number(r.avg_views) || 0;
      const suggestedDaily = avgDaily || DEFAULTS[r.slug] || 5000;
      const stars = demandStars(listingsCount, avgViews);
      const occupancy = suggestedOccupancy(stars);

      const sub = {
        slug: r.slug,
        name: r.name,
        listingsCount,
        avgDaily,
        suggestedDaily,
        avgViews,
        demand: stars,
        occupancy,
        // Rough monthly projection at the suggested price / occupancy, 22 days available.
        suggestedMonthly: Math.round(suggestedDaily * 22 * (occupancy / 100)),
      };
      subcats.push(sub);

      if (!byCat.has(r.cat_slug)) {
        byCat.set(r.cat_slug, {
          slug: r.cat_slug,
          name: r.cat_name,
          icon: r.cat_icon || "",
          subcategories: [],
        });
      }
      byCat.get(r.cat_slug).subcategories.push(sub);
    }

    res.json({
      currency: "ISK",
      platformFeePct: 10,
      defaultDaysPerMonth: 22,
      categories: Array.from(byCat.values()),
      subcategories: subcats,
    });
  })
);

module.exports = router;
