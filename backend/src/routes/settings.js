const { Router } = require("express");
const db = require("../db/pool");
const { asyncHandler } = require("../middleware/http");

const router = Router();

// Public content managed from the admin panel (FAQ / Terms / Privacy).
router.get(
  "/public",
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      "SELECT key, value FROM settings WHERE key = ANY($1)",
      [["faq_is", "terms_is", "privacy_is"]]
    );
    const out = {};
    rows.forEach((r) => { out[r.key] = r.value; });
    res.json({ settings: out });
  })
);

module.exports = router;
