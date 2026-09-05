const { Router } = require("express");
const db = require("../db/pool");
const { optionalAuth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/http");
const { paginate, publicListing } = require("../utils/helpers");

const router = Router();

const SORTS = {
  recommended: "sort_recommended DESC",
  price_asc: "price_daily ASC NULLS LAST, price_hourly ASC NULLS LAST",
  price_desc: "price_daily DESC NULLS LAST, price_hourly DESC NULLS LAST",
  rating: "rating DESC, review_count DESC",
  newest: "created_at DESC",
  distance: "distance_m ASC NULLS LAST",
  views: "view_count DESC",
};

// Paid promotion priority on the default (recommended) view:
// gold first on category pages, then featured, then platinum, then regular.
const PROMO_RANK =
  "CASE promotion_tier WHEN 'platinum' THEN 0 WHEN 'gold' THEN 1 WHEN 'silver' THEN 2 WHEN 'featured' THEN 3 ELSE 4 END";

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const {
      keyword,
      category,
      subcategory,
      location,
      lat,
      lng,
      radius,
      start,
      end,
      min_price,
      max_price,
      rating,
      verified,
      delivery,
      instant_booking,
      sort = "recommended",
      facet = "1",
    } = req.query;

    const { page, perPage, offset } = paginate(req.query.page, req.query.per_page);

    const where = ["v.status = 'published'", "v.verification_status IN ('approved','verified')"];
    const params = [];
    let p = 1;

    const push = (sql, val) => {
      params.push(val);
      return sql.replace("?", `$${p++}`);
    };

    if (keyword) {
      const kw = `%${String(keyword).trim()}%`;
      where.push(
        `(v.title ILIKE ${push("?", kw)}
          OR v.subtitle ILIKE ${push("?", kw)}
          OR v.description ILIKE ${push("?", kw)}
          OR v.category_name ILIKE ${push("?", kw)}
          OR v.subcategory_name ILIKE ${push("?", kw)}
          OR v.attributes::text ILIKE ${push("?", kw)})`
      );
    }
    if (category) {
      if (/^\d+$/.test(category)) {
        const c1 = push("?", parseInt(category, 10));
        const c2 = push("?", parseInt(category, 10));
        where.push(
          `(v.category_id = ${c1} OR v.category_id IN (SELECT id FROM categories WHERE parent_id = ${c2}))`
        );
      } else {
        where.push(
          `(v.category_slug = ${push("?", category)} OR v.subcategory_slug = ${push("?", category)})`
        );
      }
    }
    if (subcategory) {
      if (/^\d+$/.test(subcategory)) {
        where.push(push("v.subcategory_id = ?", parseInt(subcategory, 10)));
      } else {
        where.push(push("v.subcategory_slug = ?", subcategory));
      }
    }
    if (location) {
      where.push(push("lower(v.city) = lower(?)", location));
    }
    if (lat != null && lng != null) {
      const pLat = parseFloat(lat);
      const pLng = parseFloat(lng);
      if (isFinite(pLat) && isFinite(pLng)) {
        const r = radius ? parseFloat(radius) : 50; // km
        const kmPerDegLat = 111.045;
        const latDelta = r / kmPerDegLat;
        const lngDelta = r / (kmPerDegLat * Math.max(Math.cos(pLat * Math.PI / 180), 0.01));
        where.push(`v.latitude BETWEEN ${push("?", pLat - latDelta)} AND ${push("?", pLat + latDelta)}`);
        where.push(`v.longitude BETWEEN ${push("?", pLng - lngDelta)} AND ${push("?", pLng + lngDelta)}`);
      }
    }
    if (min_price != null) {
      const v = parseFloat(min_price);
      where.push(push("COALESCE(v.price_daily, v.price_hourly*24, 0) >= ?", v));
    }
    if (max_price != null) {
      const v = parseFloat(max_price);
      where.push(push("COALESCE(v.price_daily, v.price_hourly*24, 0) <= ?", v));
    }
    if (rating != null) {
      where.push(push("v.rating >= ?", parseFloat(rating)));
    }
    if (verified === "1" || verified === "true") {
      where.push("(v.owner_identity_verified OR v.verification_status = 'verified')");
    }
    if (delivery === "1" || delivery === "true") {
      where.push("v.delivery_available = TRUE");
    }
    if (instant_booking === "1" || instant_booking === "true") {
      where.push("v.instant_booking = TRUE");
    }

    // Availability filtering for a specific date range
    const hasDates = start && end;
    const sStart = hasDates ? new Date(start) : null;
    const sEnd = hasDates ? new Date(end) : null;
    if (hasDates && !isNaN(sStart) && !isNaN(sEnd)) {
      const i1 = push("?", sStart.toISOString());
      const i2 = push("?", sEnd.toISOString());
      where.push(
        `NOT EXISTS (
           SELECT 1 FROM availability a
           WHERE a.listing_id = v.id
             AND a.status IN ('blocked','booked','maintenance')
             AND a.start_time < ${i2}
             AND a.end_time > ${i1}
         )
         AND (
           NOT EXISTS (SELECT 1 FROM availability a2 WHERE a2.listing_id = v.id AND a2.status = 'available')
           OR EXISTS (
             SELECT 1 FROM availability a3
             WHERE a3.listing_id = v.id
               AND a3.status = 'available'
               AND a3.start_time <= ${i1}
               AND a3.end_time >= ${i2}
           )
         )`
      );
    }

    const distanceSelect =
      lat != null && lng != null && isFinite(parseFloat(lat)) && isFinite(parseFloat(lng))
        ? `, (6371000 * 2 * asin(
             sqrt(
               power(sin(radians(v.latitude - ${parseFloat(lat)}) / 2), 2)
               + cos(radians(${parseFloat(lat)})) * cos(radians(v.latitude))
                 * power(sin(radians(v.longitude - ${parseFloat(lng)}) / 2), 2)
             )
           )) AS distance_m`
        : "";

const sortSql = SORTS[sort] || SORTS.recommended;
    const orderSql = `${PROMO_RANK}, ${sortSql}`;
    const countRs = await db.query(
      `SELECT count(*)::int AS total FROM v_listing_search v WHERE ${where.join(" AND ")}`,
      params
    );
    const total = countRs.rows[0].total;

    const rs = await db.query(
      `SELECT v.* ${distanceSelect}
       FROM v_listing_search v
       WHERE ${where.join(" AND ")}
       ORDER BY ${orderSql}
       LIMIT ${perPage} OFFSET ${offset}`,
      params
    );

    // Mark favorites for the current user (if logged in)
    let favSet = new Set();
    if (req.user && rs.rows.length > 0) {
      const { rows: fr } = await db.query(
        `SELECT listing_id FROM favorites WHERE user_id = $1`,
        [req.user.id]
      );
      favSet = new Set(fr.map((r) => r.listing_id));
    }

    // Facet aggregates (spec section 10)
    let facets = null;
    if (facet === "1") {
      const whereSql = where.join(" AND ");
      const f = await db.query(
        `SELECT
           COALESCE((SELECT json_object_agg(slug, n) FROM (
              SELECT fc.slug AS slug, count(*)::int AS n
              FROM v_listing_search v JOIN categories fc ON fc.id = v.category_id
              WHERE ${whereSql} GROUP BY fc.slug
           ) c1), '{}')::text AS categories,
           COALESCE((SELECT json_object_agg(slug, n) FROM (
              SELECT fsub.slug AS slug, count(*)::int AS n
              FROM v_listing_search v JOIN categories fsub ON fsub.id = v.subcategory_id
              WHERE ${whereSql} GROUP BY fsub.slug
           ) c2), '{}')::text AS subcategories,
           COALESCE((SELECT json_object_agg(cityname, n) FROM (
              SELECT v.city AS cityname, count(*)::int AS n
              FROM v_listing_search v
              WHERE ${whereSql} GROUP BY v.city
           ) c3), '{}')::text AS locations`,
        params
      );
      const frow = f.rows[0];
      facets = {
        categories: JSON.parse(frow.categories),
        subcategories: JSON.parse(frow.subcategories),
        locations: JSON.parse(frow.locations),
        counts: {
          categories: Object.values(JSON.parse(frow.categories)).length,
          subcategories: Object.values(JSON.parse(frow.subcategories)).length,
          locations: Object.values(JSON.parse(frow.locations)).length,
        },
      };
    }

const listings = rs.rows.map((r) =>
      publicListing(r, { distance: true, isFavorite: favSet.has(r.id) })
    );

    res.json({
      total,
      page,
      perPage,
      pages: Math.ceil(total / perPage),
      facets,
      results: listings,
      filters: {
        keyword,
        category,
        subcategory,
        location,
        lat,
        lng,
        radius,
        start,
        end,
        min_price,
        max_price,
        rating,
        verified,
        delivery,
        instant_booking,
        sort,
      },
    });
  })
);

module.exports = router;


