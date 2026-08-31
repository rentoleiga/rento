const { Router } = require("express");
const { z } = require("zod");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler, validate, err } = require("../middleware/http");
const { getBookingRow } = require("./bookings");
const { notify } = require("../utils/notify");

const router = Router();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  communicationRating: z.number().int().min(1).max(5).optional(),
  accuracyRating: z.number().int().min(1).max(5).optional(),
  cleanlinessRating: z.number().int().min(1).max(5).optional(),
  pickupRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).default(""),
});

// Create a review for a completed booking (spec section 22: only completed)
router.post(
  "/bookings/:id/review",
  authRequired,
  validate(reviewSchema),
  asyncHandler(async (req, res) => {
    const b = await getBookingRow(req.params.id);
    if (!b) throw err("Booking not found", 404);
    if (req.user.id !== b.renter_id && req.user.id !== b.owner_id) {
      throw err("Only the renter or owner can review this booking", 403);
    }
    if (b.status !== "completed") {
      throw err("Reviews are available only for completed bookings", 409);
    }
    const { rows } = await db.query(
      `SELECT 1 FROM reviews WHERE booking_id = $1 AND reviewer_id = $2`,
      [b.id, req.user.id]
    );
    if (rows.length > 0) throw err("You already reviewed this booking", 409);

    const reviewedUserId = req.user.id === b.renter_id ? b.owner_id : b.renter_id;
    const listingId = b.listing_id;

    await db.query(
      `INSERT INTO reviews
        (booking_id, listing_id, reviewer_id, reviewed_user_id,
         rating, communication_rating, accuracy_rating, cleanliness_rating, pickup_rating, comment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        b.id, listingId, req.user.id, reviewedUserId,
        req.body.rating, req.body.communicationRating ?? null,
        req.body.accuracyRating ?? null, req.body.cleanlinessRating ?? null,
        req.body.pickupRating ?? null, req.body.comment,
      ]
    );

    // Recompute aggregates for the reviewed user
    await db.query(
      `UPDATE users u SET
         rating = (SELECT COALESCE(round(avg(rating),2),0) FROM reviews WHERE reviewed_user_id = u.id),
         review_count = (SELECT count(*) FROM reviews WHERE reviewed_user_id = u.id)
       WHERE u.id = $1`,
      [reviewedUserId]
    );
    // Recompute listing rating - counts all published reviews for that listing (both directions are linked to same listing)
    await db.query(
      `UPDATE listings l SET
         rating = (SELECT COALESCE(round(avg(rating),2),0) FROM reviews WHERE listing_id = l.id AND status='published'),
         review_count = (SELECT count(*) FROM reviews WHERE listing_id = l.id AND status='published')
       WHERE l.id = $1`,
      [listingId]
    );
    // Notify the reviewed user
    try {
      await notify(reviewedUserId, "new_review", "New review received",
        `${req.user.first_name || req.user.email} left you a ${req.body.rating}★ review for "${b.listing_title}"`, { bookingId: b.id, listingId });
    } catch {}

    res.status(201).json({ ok: true });
  })
);

// Reviews for a specific booking (both sides) - requires participant
router.get(
  "/bookings/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const b = await getBookingRow(req.params.id);
    if (!b) throw err("Booking not found", 404);
    if (req.user.id !== b.renter_id && req.user.id !== b.owner_id && req.user.role !== "admin") {
      throw err("Not allowed", 403);
    }
    const { rows } = await db.query(
      `SELECT r.*, u.first_name, u.last_name, u.avatar
       FROM reviews r JOIN users u ON u.id = r.reviewer_id
       WHERE r.booking_id = $1 AND r.status='published'
       ORDER BY r.created_at ASC`,
      [b.id]
    );
    const myReview = rows.find((r) => r.reviewer_id === req.user.id) || null;
    res.json({
      reviews: rows.map((r) => ({
        id: r.id,
        reviewerId: r.reviewer_id,
        reviewedUserId: r.reviewed_user_id,
        reviewer: { name: `${r.first_name} ${r.last_name}`.trim(), avatar: r.avatar },
        rating: r.rating,
        communicationRating: r.communication_rating,
        accuracyRating: r.accuracy_rating,
        cleanlinessRating: r.cleanliness_rating,
        pickupRating: r.pickup_rating,
        comment: r.comment,
        createdAt: r.created_at,
      })),
      myReview: myReview ? {
        id: myReview.id,
        rating: myReview.rating,
        comment: myReview.comment,
      } : null,
      canReview: b.status === "completed" && !myReview,
    });
  })
);

// Reviews for a listing
router.get(
  "/listing/:listingId",
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT r.*, u.first_name, u.last_name, u.avatar
       FROM reviews r JOIN users u ON u.id = r.reviewer_id
       WHERE r.listing_id = $1 AND r.status = 'published'
       ORDER BY r.created_at DESC LIMIT 100`,
      [req.params.listingId]
    );
    res.json({
      reviews: rows.map((r) => ({
        id: r.id,
        reviewer: {
          name: `${r.first_name} ${r.last_name}`.trim(),
          avatar: r.avatar,
        },
        rating: r.rating,
        communicationRating: r.communication_rating,
        accuracyRating: r.accuracy_rating,
        cleanlinessRating: r.cleanliness_rating,
        pickupRating: r.pickup_rating,
        comment: r.comment,
        createdAt: r.created_at,
      })),
    });
  })
);

// Reviews written about a user
router.get(
  "/user/:userId",
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT r.*, u.first_name, u.last_name, u.avatar,
              l.title AS listing_title
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       JOIN listings l ON l.id = r.listing_id
       WHERE r.reviewed_user_id = $1 AND r.status = 'published'
       ORDER BY r.created_at DESC LIMIT 100`,
      [req.params.userId]
    );
    res.json({
      reviews: rows.map((r) => ({
        id: r.id,
        reviewer: { name: `${r.first_name} ${r.last_name}`.trim(), avatar: r.avatar },
        listingTitle: r.listing_title,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
      })),
    });
  })
);

module.exports = router;