const { Router } = require("express");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler, err } = require("../middleware/http");
const {
  FREE_SLOTS,
  SLOT_PRICE,
  SLOT_PACKAGES,
  expireListings,
  activeListingCount,
} = require("../utils/slots");
const { resolvePromo, consumePromo } = require("../utils/promo");

const router = Router();

// GET /api/slots -> the "Auglýsingapláss" panel data for the logged-in user.
router.get(
  "/",
  authRequired,
  asyncHandler(async (req, res) => {
    await expireListings();
    const active = await activeListingCount(req.user.id);
    const { rows: slots } = await db.query(
      `SELECT s.id, s.package_id, s.purchased_at, s.used_at, s.expires_at,
              l.id AS listing_id, l.title AS listing_title, l.slug AS listing_slug
         FROM listing_slots s
         LEFT JOIN listings l ON l.id = s.listing_id
        WHERE s.user_id = $1
        ORDER BY (s.used_at IS NULL), s.purchased_at, s.id`,
      [req.user.id]
    );
    const inUse = slots.filter((s) => s.listing_id).length;
    const freeUsed = Math.max(0, Math.min(FREE_SLOTS, active - inUse));
    res.json({
      freeSlots: FREE_SLOTS,
      freeUsed,
      activeListings: active,
      boughtTotal: slots.length,
      available: slots.filter((s) => !s.listing_id).length,
      slotPrice: SLOT_PRICE,
      packages: SLOT_PACKAGES,
      slots: slots.map((s) => ({
        id: s.id,
        available: !s.listing_id,
        listingId: s.listing_id,
        title: s.listing_title,
        slug: s.listing_slug,
        expiresAt: s.expires_at,
      })),
    });
  })
);

// POST /api/slots/purchase { count } or { packageId } (mock payment)
router.post(
  "/purchase",
  authRequired,
  asyncHandler(async (req, res) => {
    let count;
    let amount;
    let packageId;
    if (req.body.packageId) {
      const p = SLOT_PACKAGES[req.body.packageId];
      if (!p) throw err("Unknown package", 400);
      count = p.slots;
      amount = p.amount;
      packageId = req.body.packageId;
    } else {
      count = Math.floor(Number(req.body.count));
      if (!Number.isFinite(count) || count < 1 || count > 10) {
        throw err("Count must be between 1 and 10", 400);
      }
      amount = count * SLOT_PRICE;
      packageId = "single";
    }
    const promo = await resolvePromo(req.body.code, "slot", amount);
    const finalAmount = promo.finalAmount;
    for (let i = 0; i < count; i++) {
      await db.query(
        `INSERT INTO listing_slots (user_id, package_id, amount)
         VALUES ($1, $2, $3)`,
        [req.user.id, packageId, Math.round(finalAmount / count)]
      );
    }
    await db.query(
      `INSERT INTO payments (user_id, kind, package_id, amount, promo_code, discount)
       VALUES ($1, 'slot', $2, $3, $4, $5)`,
      [req.user.id, packageId, finalAmount, promo.code, promo.discount]
    );
    await consumePromo(promo.promo);
    res.status(201).json({
      ok: true,
      slots: count,
      amount: finalAmount,
      discount: promo.discount,
      code: promo.code,
    });
  })
);

module.exports = router;
