const { Router } = require("express");
const { z } = require("zod");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler, validate, err } = require("../middleware/http");

const router = Router();

const schema = z.object({
  name: z.string().trim().max(120).default(""),
  query: z.record(z.any()).default({}),
});

router.get(
  "/",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT id, name, query, created_at, last_notified_at
         FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({
      searches: rows.map((r) => ({
        id: r.id,
        name: r.name,
        query: r.query,
        createdAt: r.created_at,
        lastNotifiedAt: r.last_notified_at,
      })),
    });
  })
);

router.post(
  "/",
  authRequired,
  validate(schema),
  asyncHandler(async (req, res) => {
    const clean = { ...req.body.query };
    delete clean.page;
    delete clean.per_page;
    const name =
      req.body.name ||
      [clean.keyword, clean.category, clean.location].filter(Boolean).join(" · ") ||
      "Vistuð leit";
    const { rows } = await db.query(
      `INSERT INTO saved_searches (user_id, name, query)
       VALUES ($1, $2, $3) RETURNING id, name, query, created_at`,
      [req.user.id, name.slice(0, 120), JSON.stringify(clean)]
    );
    res.status(201).json({ savedSearch: rows[0] });
  })
);

router.delete(
  "/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const r = await db.query(
      "DELETE FROM saved_searches WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (r.rowCount === 0) throw err("Saved search not found", 404);
    res.json({ ok: true });
  })
);

module.exports = router;
