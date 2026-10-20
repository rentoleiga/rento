const { Router } = require("express");
const { z } = require("zod");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler, validate } = require("../middleware/http");

const router = Router();

const schema = z.object({
  targetType: z.enum(["listing", "user", "message"]),
  targetId: z.number().int().positive(),
  reason: z.string().trim().min(1).max(60),
  details: z.string().trim().max(2000).default(""),
});

router.post(
  "/",
  authRequired,
  validate(schema),
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason, details)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
      [req.user.id, req.body.targetType, req.body.targetId, req.body.reason, req.body.details]
    );
    res.status(201).json({ ok: true, report: rows[0] });
  })
);

module.exports = router;
