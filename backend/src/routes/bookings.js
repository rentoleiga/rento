const { Router } = require("express");
const { z } = require("zod");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler, validate, err } = require("../middleware/http");
const { calcPrice } = require("../utils/pricing");
const { checkAvailability } = require("../utils/availability");
const { publicListing } = require("../utils/helpers");
const { notify } = require("../utils/notify");

const router = Router();

const bookingSchema = z.object({
  listingId: z.number().int().positive().optional(),
  start: z.string().refine((s) => !isNaN(Date.parse(s)), "Invalid start date"),
  end: z.string().refine((s) => !isNaN(Date.parse(s)), "Invalid end date"),
  message: z.string().max(3000).optional().default(""),
});

async function createBooking(user, listingId, body) {
  const { rows } = await db.query(`SELECT * FROM listings WHERE id = $1`, [
    listingId,
  ]);
  const listing = rows[0];
  if (!listing) throw err("Listing not found", 404);
  if (listing.status !== "published") {
    throw err("This listing is not available", 409);
  }
  if (listing.owner_id === user.id) {
    throw err("You cannot book your own listing", 400);
  }

  const s = new Date(body.start);
  const e = new Date(body.end);
  if (isNaN(s) || isNaN(e) || e <= s) throw err("Invalid date range", 400);

  const avail = await checkAvailability(listing.id, s.toISOString(), e.toISOString());
  if (!avail.available) {
    throw err("The requested dates are not available", 409, avail);
  }

  const price = calcPrice(listing, s, e);
  const totalMoney = price.total;

  const { rows: ins } = await db.query(
    `INSERT INTO bookings
      (listing_id, renter_id, owner_id, start_time, end_time,
       duration, duration_unit, base_price, extra_fees, cleaning_fee,
       delivery_fee, deposit, total, currency, status, payment_status, message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'unpaid',$16)
     RETURNING id`,
    [
      listing.id, user.id, listing.owner_id,
      s.toISOString(), e.toISOString(),
      price.duration, price.durationUnit,
      price.base, price.extraFees, price.cleaningFee,
      price.deliveryFee, price.deposit, totalMoney,
      listing.currency,
      listing.instant_booking ? "approved" : "pending",
      body.message,
    ]
  );
  const bookingId = ins[0].id;

  // Lock the period in the availability table (spec section 14)
  await db.query(
    `INSERT INTO availability (listing_id, start_time, end_time, status, booking_id)
     VALUES ($1,$2,$3,'booked',$4)`,
    [listing.id, s.toISOString(), e.toISOString(), bookingId]
  );

  const who = user.first_name ? `${user.first_name} ${user.last_name}`.trim() : user.email;
  if (listing.instant_booking) {
    await db.query(
      `INSERT INTO transactions (booking_id, payer_id, receiver_id, amount, currency, status, provider_reference)
       VALUES ($1,$2,$3,$4,$5,'authorized','mock_payment')`,
      [bookingId, user.id, listing.owner_id, totalMoney, listing.currency]
    );
    await notify(listing.owner_id, "booking_confirmed", "New instant booking",
      `${who} booked "${listing.title}"`, { bookingId });
  } else {
    await notify(listing.owner_id, "booking_request", "New booking request",
      `${who} requested "${listing.title}"`, { bookingId });
  }
  await notify(user.id, "booking_created", "Booking request sent",
    `Your booking request for "${listing.title}" was sent to the owner.`, { bookingId });

  const booking = await getBookingRow(bookingId);
  return booking;
}

// ---------------- create booking request ----------------
router.post(
  "/",
  authRequired,
  validate(bookingSchema),
  asyncHandler(async (req, res) => {
    if (!req.body.listingId) throw err("listingId is required", 400);
    const booking = await createBooking(req.user, req.body.listingId, req.body);
    res.status(201).json({ booking: serializeBooking(booking) });
  })
);

router.post(
  "/listings/:listingId/book",
  authRequired,
  validate(bookingSchema),
  asyncHandler(async (req, res) => {
    const booking = await createBooking(req.user, req.params.listingId, req.body);
    res.status(201).json({ booking: serializeBooking(booking) });
  })
);

async function getBookingRow(id) {
  const { rows } = await db.query(
    `SELECT b.*,
            l.title AS listing_title, l.slug AS listing_slug, l.main_image AS listing_image,
            l.city AS listing_city, l.currency AS listing_currency,
            l.price_daily, l.price_hourly, l.price_weekly,
            r.first_name AS renter_first, r.last_name AS renter_last, r.avatar AS renter_avatar, r.email AS renter_email,
            o.first_name AS owner_first, o.last_name AS owner_last, o.avatar AS owner_avatar, o.email AS owner_email
     FROM bookings b
     JOIN listings l ON l.id = b.listing_id
     JOIN users r ON r.id = b.renter_id
     JOIN users o ON o.id = b.owner_id
     WHERE b.id = $1`,
    [id]
  );
  return rows[0] || null;
}

function serializeBooking(b) {
  if (!b) return null;
  return {
    id: b.id,
    listing: {
      id: b.listing_id,
      title: b.listing_title,
      slug: b.listing_slug,
      image: b.listing_image,
      city: b.listing_city,
    },
    renter: {
      id: b.renter_id,
      name: `${b.renter_first} ${b.renter_last}`.trim() || b.renter_email,
      avatar: b.renter_avatar,
    },
    owner: {
      id: b.owner_id,
      name: `${b.owner_first} ${b.owner_last}`.trim() || b.owner_email,
      avatar: b.owner_avatar,
    },
    start: b.start_time,
    end: b.end_time,
    duration: Number(b.duration),
    durationUnit: b.duration_unit,
    basePrice: Number(b.base_price),
    extraFees: Number(b.extra_fees),
    cleaningFee: Number(b.cleaning_fee),
    deliveryFee: Number(b.delivery_fee),
    deposit: Number(b.deposit),
    total: Number(b.total),
    currency: b.currency,
    status: b.status,
    paymentStatus: b.payment_status,
    pickupStatus: b.pickup_status,
    returnStatus: b.return_status,
    message: b.message,
    createdAt: b.created_at,
  };
}

// ---------------- booking detail ----------------
router.get(
  "/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const b = await getBookingRow(req.params.id);
    if (!b) throw err("Booking not found", 404);
    if (req.user.role !== "admin" && req.user.id !== b.renter_id && req.user.id !== b.owner_id) {
      throw err("Not allowed", 403);
    }
    res.json({ booking: serializeBooking(b) });
  })
);

// ---------------- status transitions ----------------
const statusSchema = z.object({
  action: z.enum(["approve", "reject", "cancel", "pay", "pickup", "return", "complete"]),
  reason: z.string().max(500).optional().default(""),
});

router.put(
  "/:id/status",
  authRequired,
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    const { action, reason } = req.body;
    const b = await getBookingRow(req.params.id);
    if (!b) throw err("Booking not found", 404);
    const isOwner = req.user.id === b.owner_id;
    const isRenter = req.user.id === b.renter_id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isRenter && !isAdmin) throw err("Not allowed", 403);

    const transitions = {
      approve: { roles: ["owner"], from: ["pending"], to: "approved" },
      reject: { roles: ["owner"], from: ["pending"], to: "rejected" },
      cancel: { roles: ["renter", "owner"], from: ["pending", "approved"], to: "cancelled" },
      pay: { roles: ["renter"], from: ["approved"], to: "active" },
      pickup: { roles: ["owner"], from: ["active"], to: "active" },
      return: { roles: ["renter", "owner"], from: ["active"], to: "returned" },
      complete: { roles: ["owner"], from: ["returned"], to: "completed" },
    };
    const t = transitions[action];
    if (!t) throw err("Unknown action", 400);

    const roleOk = isAdmin || (action === "cancel" ? t.roles : isOwner ? t.roles.includes("owner") : isRenter ? t.roles.includes("renter") : false);
    if (!roleOk) throw err("Your role cannot perform this action", 403);
    if (!t.from.includes(b.status)) {
      throw err(`Cannot ${action} a booking in "${b.status}" status`, 409);
    }

    let nextPickup = b.pickup_status;
    let nextReturn = b.return_status;

    if (action === "pay") {
      // create a paid transaction (MVP mock; replace with Stripe webhook in Phase 3)
      await db.query(
        `INSERT INTO transactions (booking_id, payer_id, receiver_id, amount, platform_fee, owner_amount, currency, status, provider_reference)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'paid','mock_payment')
         ON CONFLICT DO NOTHING`,
        [b.id, b.renter_id, b.owner_id, b.total, 0, b.total, b.currency]
      );
      await notify(b.owner_id, "payment_success", "Payment received",
        `Payment of ${b.total} ${b.currency} received for "${b.listing_title}".`, { bookingId: b.id });
    }
    if (action === "pickup") nextPickup = "picked_up";
    if (action === "return") nextReturn = "returned";
    if (action === "complete") nextReturn = "inspected";

    await db.query(
      `UPDATE bookings
       SET status = $2, payment_status = $3, pickup_status = $4, return_status = $5,
           cancellation_reason = $6, updated_at = now()
       WHERE id = $1`,
      [
        b.id,
        action === "pay" ? "active" : t.to,
        action === "pay" ? "paid" : b.payment_status,
        nextPickup,
        nextReturn,
        ["reject", "cancel"].includes(action) ? reason : "",
      ]
    );

    if (action === "reject" || action === "cancel") {
      await db.query(
        `DELETE FROM availability WHERE booking_id = $1 AND status = 'booked'`,
        [b.id]
      );
      await notify(b.renter_id, "booking_rejected", action === "cancel" ? "Booking cancelled" : "Booking request rejected",
        `Your booking for "${b.listing_title}" was ${action === "cancel" ? "cancelled" : "rejected"}.`, { bookingId: b.id });
      if (action === "cancel" && isRenter) {
        await notify(b.owner_id, "booking_rejected", "Booking cancelled by renter",
          `The booking for "${b.listing_title}" was cancelled.`, { bookingId: b.id });
      }
    }

    if (action === "approve") {
      await notify(b.renter_id, "booking_approved", "Booking request approved",
        `Your booking for "${b.listing_title}" was approved. Please proceed to payment.`, { bookingId: b.id });
    }

    const updated = await getBookingRow(b.id);
    res.json({ booking: serializeBooking(updated) });
  })
);

// ---------------- price quote (public) ----------------
router.post(
  "/listings/:listingId/quote",
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(`SELECT * FROM listings WHERE id = $1`, [
      req.params.listingId,
    ]);
    const listing = rows[0];
    if (!listing) throw err("Listing not found", 404);
    const s = new Date(req.body.start);
    const e = new Date(req.body.end);
    if (isNaN(s) || isNaN(e) || e <= s) throw err("Invalid date range", 400);
    const price = calcPrice(listing, s, e);
    res.json({ ...price, currency: listing.currency });
  })
);

module.exports = router;
module.exports.serializeBooking = serializeBooking;
module.exports.getBookingRow = getBookingRow;