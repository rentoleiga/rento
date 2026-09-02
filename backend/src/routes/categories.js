const { Router } = require("express");
const db = require("../db/pool");
const { asyncHandler } = require("../middleware/http");

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const lang = req.query.lang || "en";
    const { rows } = await db.query(
      `SELECT c.id, c.parent_id, c.slug, c.icon, c.sort_order,
              COALESCE(ct.name, cte.name, '') AS name
       FROM categories c
       LEFT JOIN category_translations ct
         ON ct.category_id = c.id AND ct.language = $1
       LEFT JOIN category_translations cte
         ON cte.category_id = c.id AND cte.language = 'en'
       WHERE c.parent_id IS NULL
       ORDER BY c.sort_order, c.id`,
      [lang]
    );
    const cats = rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      icon: c.icon,
      name: c.name,
      sortOrder: c.sort_order,
    }));
    res.json({ categories: cats });
  })
);

router.get(
  "/all",
  asyncHandler(async (req, res) => {
    const lang = req.query.lang || "en";
    const { rows } = await db.query(
      `SELECT c.id, c.parent_id, c.slug, c.icon, c.sort_order,
              COALESCE(ct.name, cte.name, '') AS name,
              (SELECT count(*)::int FROM listings l
               WHERE l.status='published'
                 AND (l.category_id = c.id OR l.subcategory_id = c.id
                      OR l.category_id IN (SELECT id FROM categories WHERE parent_id = c.id))) AS listing_count
       FROM categories c
       LEFT JOIN category_translations ct
         ON ct.category_id = c.id AND ct.language = $1
       LEFT JOIN category_translations cte
         ON cte.category_id = c.id AND cte.language = 'en'
       ORDER BY c.sort_order, c.id`,
      [lang]
    );
    res.json({ categories: rows });
  })
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const lang = req.query.lang || "en";
    const { rows } = await db.query(
      `SELECT c.id, c.slug, c.icon,
              COALESCE(ct.name, cte.name, '') AS name
       FROM categories c
       LEFT JOIN category_translations ct
         ON ct.category_id = c.id AND ct.language = $2
       LEFT JOIN category_translations cte
         ON cte.category_id = c.id AND cte.language = 'en'
       WHERE c.slug = $1`,
      [req.params.slug, lang]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    const cat = rows[0];
    const { rows: children } = await db.query(
      `SELECT c.id, c.slug, c.icon, COALESCE(ct.name, cte.name, '') AS name
       FROM categories c
       LEFT JOIN category_translations ct
         ON ct.category_id = c.id AND ct.language = $2
       LEFT JOIN category_translations cte
         ON cte.category_id = c.id AND cte.language = 'en'
       WHERE c.parent_id = $1
       ORDER BY c.sort_order, c.id`,
      [cat.id, lang]
    );
    res.json({
      category: cat,
      subcategories: children,
      listingCount: (
        await db.query(
          `SELECT count(*)::int AS n FROM listings
           WHERE status='published' AND (category_id=$1 OR subcategory_id=$1 OR category_id IN (SELECT id FROM categories WHERE parent_id=$1))`,
          [cat.id]
        )
      ).rows[0].n,
    });
  })
);

module.exports = router;