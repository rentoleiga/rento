const { Router } = require("express");
const { z } = require("zod");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler, validate, err } = require("../middleware/http");
const { checkAvailability } = require("../utils/availability");
const { getListingOr404 } = require("./listings");

const router = Router();

// Available to anyone: check whether a listing is free for a given slot
router.get(
  "/check",
  asyncHandler(async (req, res) => {
    const { listing_id, start, end } = req.query;
    if (!listing_id || !start || !end) {
      throw err("listing_id, start and end are required", 400);
    }
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e) || e <= s) {
      throw err("Invalid date range", 400);
    }
    const result = await checkAvailability(parseInt(listing_id, 10), s.toISOString(), e.toISOString());
    const price = await db.query(
      `SELECT price_hourly, price_daily, price_weekly, price_monthly,
              cleaning_fee, delivery_fee, pickup_fee, extra_fee, deposit_amount
       FROM listings WHERE id = $1`,
      [listing_id]
    );
    if (price.rowCount === 0) throw err("Listing not found", 404);
    res.json({ ...result, listing_id: parseInt(listing_id, 10) });
  })
);

// Owner: list availability records for a listing
router.get(
  "/listing/:listingId",
  authRequired,
  asyncHandler(async (req, res) => {
    const listing = await getListingOr404({ params: { id: req.params.listingId } }, res);
    if (!listing) throw err("Listing not found", 404);
    if (req.user.role !== "admin" && req.user.id !== listing.owner_id) {
      throw err("Only the owner can manage availability", 403);
    }
    const { rows } = await db.query(
      `SELECT a.id, a.start_time, a.end_time, a.status, a.booking_id
       FROM availability a
       WHERE a.listing_id = $1
       ORDER BY a.start_time DESC
       LIMIT 500`,
      [listing.id]
    );
    res.json({
      availability: rows.map((r) => ({
        id: r.id,
        start: r.start_time,
        end: r.end_time,
        status: r.status,
        bookingId: r.booking_id,
      })),
    });
  })
);

const addSchema = z.object({
  start: z.string().refine((s) => !isNaN(Date.parse(s)), "Invalid start"),
  end: z.string().refine((s) => !isNaN(Date.parse(s)), "Invalid end"),
  status: z.enum(["available", "blocked", "maintenance"]).default("blocked"),
});

// Owner: add an availability window or block
router.post(
  "/listing/:listingId",
  authRequired,
  validate(addSchema),
  asyncHandler(async (req, res) => {
    const listing = await getListingOr404({ params: { id: req.params.listingId } }, res);
    if (!listing) throw err("Listing not found", 404);
    if (req.user.role !== "admin" && req.user.id !== listing.owner_id) {
      throw err("Only the owner can manage availability", 403);
    }
    const s = new Date(req.body.start);
    const e = new Date(req.body.end);
    if (e <= s) throw err("end must be after start", 400);

    // Prevent an owner block overlapping existing bookings
    if (req.body.status !== "available") {
      const overlap = await db.query(
        `SELECT 1 FROM bookings
         WHERE listing_id = $1
           AND status NOT IN ('rejected','cancelled')
           AND start_time < $3 AND end_time > $2 LIMIT 1`,
        [listing.id, s.toISOString(), e.toISOString()]
      );
      if (overlap.rowCount > 0) {
        throw err("This period overlaps an existing booking", 409);
      }
    }

    const { rows } = await db.query(
      `INSERT INTO availability (listing_id, start_time, end_time, status)
       VALUES ($1,$2,$3,$4) RETURNING id, start_time, end_time, status`,
      [listing.id, s.toISOString(), e.toISOString(), req.body.status]
    );
    res.status(201).json({ availability: rows[0] });
  })
);

router.delete(
  "/:availId",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT a.*, l.owner_id FROM availability a
       JOIN listings l ON l.id = a.listing_id
       WHERE a.id = $1`,
      [req.params.availId]
    );
    if (rows.length === 0) throw err("Availability record not found", 404);
    if (req.user.role !== "admin" && req.user.id !== rows[0].owner_id) {
      throw err("Only the owner can manage availability", 403);
    }
    await db.query(`DELETE FROM availability WHERE id = $1`, [req.params.availId]);
    res.json({ ok: true });
  })
);

module.exports = router;