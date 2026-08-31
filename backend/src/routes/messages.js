const { Router } = require("express");
const { z } = require("zod");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler, validate, err } = require("../middleware/http");
const { notify } = require("../utils/notify");

const router = Router();

const startSchema = z.object({
  listingId: z.number().int().positive(),
  recipientId: z.number().int().positive(),
  bookingId: z.number().int().positive().optional(),
  message: z.string().min(1).max(3000),
});

const sendSchema = z.object({
  message: z.string().min(1).max(3000),
});

async function conversationRow(id, userId) {
  const { rows } = await db.query(
    `SELECT c.*,
            l.title AS listing_title, l.slug AS listing_slug, l.main_image AS listing_image,
            r.id AS renter_id, r.first_name AS renter_first, r.last_name AS renter_last, r.avatar AS renter_avatar,
            o.id AS owner_id, o.first_name AS owner_first, o.last_name AS owner_last, o.avatar AS owner_avatar,
            (SELECT count(*)::int FROM messages m WHERE m.conversation_id = c.id AND m.receiver_id = $2 AND m.read_at IS NULL) AS unread
     FROM conversations c
     JOIN listings l ON l.id = c.listing_id
     JOIN users r ON r.id = c.renter_id
     JOIN users o ON o.id = c.owner_id
     WHERE c.id = $1 AND (c.renter_id = $2 OR c.owner_id = $2)`,
    [id, userId]
  );
  return rows[0] || null;
}

// Start a conversation about a listing
router.post(
  "/",
  authRequired,
  validate(startSchema),
  asyncHandler(async (req, res) => {
    const listing = await db.query(`SELECT * FROM listings WHERE id = $1`, [req.body.listingId]);
    if (listing.rowCount === 0) throw err("Listing not found", 404);
    const ownerId = listing.rows[0].owner_id;
    if (ownerId === req.user.id) throw err("You cannot message yourself", 400);
    if (ownerId !== req.body.recipientId) throw err("Recipient must be the listing owner", 400);

    const existing = await db.query(
      `SELECT c.* FROM conversations c
       WHERE c.listing_id = $1 AND c.renter_id = $2 AND c.owner_id = $3
       ORDER BY c.updated_at DESC LIMIT 1`,
      [req.body.listingId, req.user.id, ownerId]
    );

    let conv;
    if (existing.rowCount > 0) {
      conv = existing.rows[0];
    } else {
      const ins = await db.query(
        `INSERT INTO conversations (listing_id, booking_id, renter_id, owner_id)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [req.body.listingId, req.body.bookingId || null, req.user.id, ownerId]
      );
      conv = ins.rows[0];
    }

    await db.query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, message)
       VALUES ($1,$2,$3,$4)`,
      [conv.id, req.user.id, ownerId, req.body.message]
    );
    await db.query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [conv.id]);
    await notify(ownerId, "new_message", "New message",
      `${req.user.first_name || req.user.email} sent you a message.`, { conversationId: conv.id });

    const full = await conversationRow(conv.id, req.user.id);
    res.status(201).json({ conversation: full });
  })
);

// List my conversations
router.get(
  "/",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT c.*, l.title AS listing_title, l.slug AS listing_slug, l.main_image AS listing_image,
              r.first_name AS renter_first, r.last_name AS renter_last, r.avatar AS renter_avatar,
              o.first_name AS owner_first, o.last_name AS owner_last, o.avatar AS owner_avatar,
              (SELECT count(*)::int FROM messages m WHERE m.conversation_id = c.id AND m.receiver_id = $1 AND m.read_at IS NULL) AS unread,
              (SELECT max(created_at) FROM messages m WHERE m.conversation_id = c.id) AS last_message_at
       FROM conversations c
       JOIN listings l ON l.id = c.listing_id
       JOIN users r ON r.id = c.renter_id
       JOIN users o ON o.id = c.owner_id
       WHERE c.renter_id = $1 OR c.owner_id = $1
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    );
    res.json({ conversations: rows });
  })
);

// Messages in a conversation (also marks incoming as read)
router.get(
  "/:id/messages",
  authRequired,
  asyncHandler(async (req, res) => {
    const conv = await conversationRow(req.params.id, req.user.id);
    if (!conv) throw err("Conversation not found", 404);
    await db.query(
      `UPDATE messages SET read_at = now()
       WHERE conversation_id = $1 AND receiver_id = $2 AND read_at IS NULL`,
      [req.params.id, req.user.id]
    );
    const { rows } = await db.query(
      `SELECT id, sender_id, receiver_id, message, attachment, read_at, created_at
       FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 500`,
      [req.params.id]
    );
    const otherId = req.user.id === conv.renter_id ? conv.owner_id : conv.renter_id;
    res.json({ messages: rows, conversation: conv, otherUserId: otherId });
  })
);

// Reply
router.post(
  "/:id/messages",
  authRequired,
  validate(sendSchema),
  asyncHandler(async (req, res) => {
    const conv = await conversationRow(req.params.id, req.user.id);
    if (!conv) throw err("Conversation not found", 404);
    const receiverId = req.user.id === conv.renter_id ? conv.owner_id : conv.renter_id;
    await db.query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, message)
       VALUES ($1,$2,$3,$4)`,
      [req.params.id, req.user.id, receiverId, req.body.message]
    );
    await db.query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [req.params.id]);
    await notify(receiverId, "new_message", "New message",
      `${req.user.first_name || req.user.email} sent you a message.`, { conversationId: conv.id });
    const { rows } = await db.query(
      `SELECT id, sender_id, receiver_id, message, attachment, read_at, created_at
       FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    res.status(201).json({ message: rows[0] });
  })
);

// Unread count badge
router.get(
  "/unread-count",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT count(*)::int AS unread
       FROM messages m JOIN conversations c ON c.id = m.conversation_id
       WHERE (c.renter_id = $1 OR c.owner_id = $1) AND m.receiver_id = $1 AND m.read_at IS NULL`,
      [req.user.id]
    );
    res.json({ unread: rows[0].unread });
  })
);

module.exports = router;