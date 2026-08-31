const { Router } = require("express");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/http");
const { publicListing } = require("../utils/helpers");
const { serializeBooking } = require("./bookings");

const router = Router();

// Combined dashboard overview for owner + renter (spec 25/26)
router.get(
  "/overview",
  authRequired,
  asyncHandler(async (req, res) => {
    const me = req.user.id;
    const [ownerBookings, renterBookings, listings, unread, notifications, favoriteRows] =
      await Promise.all([
        db.query(
          `SELECT status, count(*)::int AS n FROM bookings
           WHERE owner_id = $1 GROUP BY status`, [me]),
        db.query(
          `SELECT status, count(*)::int AS n FROM bookings
           WHERE renter_id = $1 GROUP BY status`, [me]),
        db.query(
          `SELECT count(*)::int AS n, count(*) FILTER (WHERE status='published')::int AS active
           FROM listings WHERE owner_id = $1 AND status <> 'deleted'`, [me]),
        db.query(
          `SELECT count(*)::int AS n FROM messages m
           JOIN conversations c ON c.id = m.conversation_id
           WHERE (c.renter_id=$1 OR c.owner_id=$1) AND m.receiver_id=$1 AND m.read_at IS NULL`, [me]),
        db.query(
          `SELECT count(*)::int AS n FROM notifications WHERE user_id=$1 AND read_at IS NULL`, [me]),
        db.query(
          `SELECT f.listing_id FROM favorites f WHERE f.user_id=$1`, [me]),
      ]);

    const countBy = (rows, key) => rows.find((r) => r.status === key)?.n || 0;

    const earnings = await db.query(
      `SELECT COALESCE(sum(total) FILTER (WHERE status IN ('active','returned','completed')), 0) AS revenue,
              COALESCE(sum(total) FILTER (WHERE status='completed'), 0) AS completed_revenue,
              count(*) FILTER (WHERE status IN ('active','returned','completed'))::int AS paid_count
       FROM bookings WHERE owner_id = $1`, [me]);

    res.json({
      owner: {
        listingsTotal: listings.rows[0].n,
        listingsActive: listings.rows[0].active,
        bookingRequests: countBy(ownerBookings.rows, "pending"),
        bookingsActive: countBy(ownerBookings.rows, "active"),
        bookingsCompleted: countBy(ownerBookings.rows, "completed"),
        revenue: Number(earnings.rows[0].revenue),
        completedRevenue: Number(earnings.rows[0].completed_revenue),
        paidBookings: earnings.rows[0].paid_count,
      },
      renter: {
        upcoming: countBy(renterBookings.rows, "approved") + countBy(renterBookings.rows, "active"),
        active: countBy(renterBookings.rows, "active"),
        completed: countBy(renterBookings.rows, "completed"),
        cancelled: countBy(renterBookings.rows, "cancelled") + countBy(renterBookings.rows, "rejected"),
      },
      unreadMessages: unread.rows[0].n,
      unreadNotifications: notifications.rows[0].n,
      favorites: favoriteRows.rows.map((r) => r.listing_id),
    });
  })
);

// Owner: recent bookings across all their listings
router.get(
  "/owner/bookings",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT b.*, l.title AS listing_title, l.slug AS listing_slug, l.main_image AS listing_image,
              r.first_name AS renter_first, r.last_name AS renter_last, r.avatar AS renter_avatar
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       JOIN users r ON r.id = b.renter_id
       WHERE b.owner_id = $1
       ORDER BY b.created_at DESC LIMIT 200`,
      [req.user.id]
    );
    res.json({
      bookings: rows.map((r) => ({
        ...serializeBooking({
          ...r,
          owner_first: req.user.first_name, owner_last: req.user.last_name, owner_avatar: req.user.avatar,
          owner_id: req.user.id, owner_email: req.user.email,
        }),
        renter: { id: r.renter_id, name: `${r.renter_first} ${r.renter_last}`.trim(), avatar: r.renter_avatar },
      })),
    });
  })
);

// Renter: list my bookings, optionally filtered by status
router.get(
  "/renter/bookings",
  authRequired,
  asyncHandler(async (req, res) => {
    const filter = req.query.status;
    const conds = ["b.renter_id = $1"];
    const params = [req.user.id];
    if (filter && ["pending", "approved", "active", "returned", "completed", "cancelled", "rejected"].includes(filter)) {
      params.push(filter);
      conds.push(`b.status = $${params.length}`);
    }
    const { rows } = await db.query(
      `SELECT b.*, l.title AS listing_title, l.slug AS listing_slug, l.main_image AS listing_image, l.city AS listing_city,
              o.first_name AS owner_first, o.last_name AS owner_last, o.avatar AS owner_avatar
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       JOIN users o ON o.id = b.owner_id
       WHERE ${conds.join(" AND ")}
       ORDER BY b.created_at DESC LIMIT 200`,
      params
    );
    res.json({
      bookings: rows.map((r) =>
        serializeBooking({
          ...r,
          renter_first: req.user.first_name, renter_last: req.user.last_name,
          renter_avatar: req.user.avatar, renter_id: req.user.id, renter_email: req.user.email,
        })
      ),
    });
  })
);

// Owner: my listings (including drafts)
router.get(
  "/owner/listings",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT l.*, c.slug AS category_slug, COALESCE(ct.name,'') AS category_name
       FROM listings l
       LEFT JOIN categories c ON c.id = l.category_id
       LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language = 'en'
       WHERE l.owner_id = $1 AND l.status <> 'deleted'
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    res.json({ listings: rows.map((r) => publicListing(r)) });
  })
);

// Cats for a listing (availability calendar data: bookings + blocks)
router.get(
  "/owner/listings/:listingId/calendar",
  authRequired,
  asyncHandler(async (req, res) => {
    const listing = await db.query(
      `SELECT * FROM listings WHERE id = $1 AND owner_id = $2 AND status <> 'deleted'`,
      [req.params.listingId, req.user.id]
    );
    if (listing.rowCount === 0) throw Object.assign(new Error("Listing not found"), { status: 404 });
    const [avail, bookings] = await Promise.all([
      db.query(
        `SELECT id, start_time, end_time, status, booking_id FROM availability
         WHERE listing_id = $1 ORDER BY start_time`, [req.params.listingId]),
      db.query(
        `SELECT b.id, b.start_time, b.end_time, b.status, b.renter_id, b.total, b.currency,
                r.first_name, r.last_name
         FROM bookings b JOIN users r ON r.id = b.renter_id
         WHERE b.listing_id = $1 AND b.status NOT IN ('rejected','cancelled')
         ORDER BY b.start_time`, [req.params.listingId]),
    ]);
    res.json({
      availability: avail.rows,
      bookings: bookings.rows.map((b) => ({
        id: b.id,
        start: b.start_time,
        end: b.end_time,
        status: b.status,
        renterName: `${b.first_name} ${b.last_name}`.trim(),
        total: Number(b.total),
        currency: b.currency,
      })),
    });
  })
);

module.exports = router;