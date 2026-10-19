const { Router } = require("express");
const crypto = require("crypto");
const db = require("../db/pool");
const config = require("../config");
const { authRequired, adminRequired } = require("../middleware/auth");
const { asyncHandler, err } = require("../middleware/http");
const { paginate } = require("../utils/helpers");
const { logAdminAction } = require("../utils/adminLog");
const creditGuard = require("../services/creditGuard");

const router = Router();

// Everything under /api/admin requires a logged-in superuser.
router.use(authRequired, adminRequired);

const countBy = (rows) => {
  const out = {};
  for (const r of rows) out[r.status] = r.n;
  return out;
};

// GET /api/admin/overview -> platform-wide statistics
router.get(
  "/overview",
  asyncHandler(async (req, res) => {
    const [users, listings, bookings, txs, credits, regByDay, msgs, reviews] =
      await Promise.all([
        db.query(
          `SELECT count(*)::int AS total,
                  count(*) FILTER (WHERE role = 'admin')::int AS admins,
                  count(*) FILTER (WHERE created_at > now() - interval '1 day')::int AS new1,
                  count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS new7,
                  count(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS new30,
                  count(*) FILTER (WHERE email_verified) ::int AS email_verified,
                  count(*) FILTER (WHERE identity_verified) ::int AS identity_verified
           FROM users`
        ),
        db.query(
          `SELECT status, count(*)::int AS n,
                  count(*) FILTER (WHERE promotion_until > now())::int AS boosted
           FROM listings GROUP BY status`
        ),
        db.query(
          `SELECT status, count(*)::int AS n,
                  COALESCE(sum(total) FILTER (WHERE status IN ('active','returned','completed')), 0) AS revenue
           FROM bookings GROUP BY status`
        ),
        db.query(
          `SELECT status, count(*)::int AS n,
                  COALESCE(sum(amount), 0) AS amount,
                  COALESCE(sum(platform_fee), 0) AS fees
           FROM transactions GROUP BY status`
        ),
        db.query(
          `SELECT COALESCE(sum(amount) FILTER (WHERE type = 'purchase'), 0) AS issued,
                  COALESCE(sum(amount) FILTER (WHERE amount < 0), 0) AS spent,
                  count(*)::int AS entries,
                  (SELECT COALESCE(sum(credit_balance), 0) FROM users) AS outstanding,
                  (SELECT COALESCE(sum(extra_slots), 0) FROM users) AS extra_slots
           FROM credit_transactions`
        ),
        db.query(
          `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, count(*)::int AS n
           FROM users WHERE created_at > now() - interval '30 days'
           GROUP BY 1 ORDER BY 1`
        ),
        db.query(`SELECT count(*)::int AS n FROM messages`),
        db.query(`SELECT count(*)::int AS n FROM reviews`),
      ]);

    const listingRows = listings.rows;
    const bookingRows = bookings.rows;
    const txRows = txs.rows;
    const revenue = bookingRows.reduce((s, r) => s + Number(r.revenue), 0);
    const boosted = listingRows.reduce((s, r) => s + r.boosted, 0);
    const paidTxs = txRows.find((r) => r.status === "paid");

    res.json({
      users: {
        total: users.rows[0].total,
        admins: users.rows[0].admins,
        new1: users.rows[0].new1,
        new7: users.rows[0].new7,
        new30: users.rows[0].new30,
        emailVerified: users.rows[0].email_verified,
        identityVerified: users.rows[0].identity_verified,
      },
      listings: {
        byStatus: countBy(listingRows),
        total: listingRows.reduce((s, r) => s + r.n, 0),
        published: countBy(listingRows).published || 0,
        boosted,
      },
      bookings: {
        byStatus: countBy(bookingRows),
        total: bookingRows.reduce((s, r) => s + r.n, 0),
        revenue,
      },
      payments: {
        byStatus: countBy(txRows),
        total: txRows.reduce((s, r) => s + r.n, 0),
        paidAmount: Number(paidTxs?.amount || 0),
        fees: Number(paidTxs?.fees || 0),
      },
      credits: {
        issued: Number(credits.rows[0].issued),
        spent: Number(credits.rows[0].spent),
        outstanding: Number(credits.rows[0].outstanding),
        extraSlots: credits.rows[0].extra_slots,
        entries: credits.rows[0].entries,
      },
      messages: msgs.rows[0].n,
      reviews: reviews.rows[0].n,
      registrations: regByDay.rows.map((r) => ({ day: r.day, n: r.n })),
    });
  })
);

// GET /api/admin/users?q=&role=&page= -> paginated user list
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { page, perPage, offset } = paginate(req.query.page, req.query.perPage || 25);
    const q = String(req.query.q || "").trim();
    const role = String(req.query.role || "").trim();
    const conds = [];
    const params = [];
    if (q) {
      params.push(`%${q}%`);
      const i = params.length;
      conds.push(
        `(u.email ILIKE $${i} OR u.first_name ILIKE $${i} OR u.last_name ILIKE $${i} OR u.city ILIKE $${i})`
      );
    }
    if (role === "user" || role === "admin") {
      params.push(role);
      conds.push(`u.role = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const [list, total] = await Promise.all([
      db.query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.city, u.avatar, u.role,
                u.credit_balance, u.extra_slots,
                u.email_verified, u.phone_verified, u.identity_verified,
                u.business_verified, u.listing_verified,
                u.rating, u.review_count, u.completed_rentals, u.created_at,
                (SELECT count(*) FROM listings l WHERE l.owner_id = u.id AND l.status <> 'deleted')::int AS listings,
                (SELECT count(*) FROM bookings b WHERE b.owner_id = u.id OR b.renter_id = u.id)::int AS bookings
         FROM users u
         ${where}
         ORDER BY u.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, perPage, offset]
      ),
      db.query(`SELECT count(*)::int AS n FROM users u ${where}`, params),
    ]);

    res.json({ users: list.rows, total: total.rows[0].n, page, perPage });
  })
);

// GET /api/admin/users/:id -> full profile: listings, bookings, credit ledger
router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) throw err("Invalid user id", 400);

    const [u, listings, bookings, credits] = await Promise.all([
      db.query(
        `SELECT id, email, first_name, last_name, city, phone, avatar, bio, language, role,
                renter_enabled, owner_enabled, business_account,
                email_verified, phone_verified, identity_verified, business_verified, listing_verified,
                rating, review_count, completed_rentals, response_rate, response_time,
                credit_balance, extra_slots, created_at, updated_at
         FROM users WHERE id = $1`,
        [id]
      ),
      db.query(
        `SELECT id, title, slug, status, promotion_tier, promotion_until, price_daily, price_hourly,
                currency, view_count, favorite_count, created_at
         FROM listings WHERE owner_id = $1 AND status <> 'deleted'
         ORDER BY created_at DESC LIMIT 100`,
        [id]
      ),
      db.query(
        `SELECT b.id, b.status, b.payment_status, b.total, b.currency, b.start_time, b.created_at,
                b.owner_id, l.title AS listing_title
         FROM bookings b
         LEFT JOIN listings l ON l.id = b.listing_id
         WHERE b.owner_id = $1 OR b.renter_id = $1
         ORDER BY b.created_at DESC LIMIT 100`,
        [id]
      ),
      db.query(
        `SELECT id, type, amount, description, listing_id, created_at
         FROM credit_transactions WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 100`,
        [id]
      ),
    ]);
    if (u.rows.length === 0) throw err("User not found", 404);

    res.json({
      user: u.rows[0],
      listings: listings.rows,
      bookings: bookings.rows,
      credits: credits.rows,
    });
  })
);

// PATCH /api/admin/users/:id/role { role } -> promote / demote (audited)
router.patch(
  "/users/:id/role",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const role = req.body?.role;
    if (!id) throw err("Invalid user id", 400);
    if (role !== "user" && role !== "admin") throw err("role must be 'user' or 'admin'", 400);
    if (id === req.user.id) throw err("You cannot change your own role", 400);

    const upd = await db.query(
      `UPDATE users SET role = $1, updated_at = now() WHERE id = $2
       RETURNING id, email, role`,
      [role, id]
    );
    if (upd.rowCount === 0) throw err("User not found", 404);

    await logAdminAction({
      adminId: req.user.id,
      action: "user.role_change",
      targetType: "user",
      targetId: id,
      data: { role, email: upd.rows[0].email },
      ip: req.ip,
    });

    res.json({ user: upd.rows[0] });
  })
);

// GET /api/admin/actions?action=&page= -> the audit trail
router.get(
  "/actions",
  asyncHandler(async (req, res) => {
    const { page, perPage, offset } = paginate(req.query.page, req.query.perPage || 30);
    const action = String(req.query.action || "").trim();
    const conds = [];
    const params = [];
    if (action) {
      params.push(`${action}%`);
      conds.push(`a.action LIKE $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const [list, total] = await Promise.all([
      db.query(
        `SELECT a.id, a.action, a.target_type, a.target_id, a.data, a.ip, a.created_at,
                a.admin_id, u.email AS admin_email,
                u.first_name AS admin_first, u.last_name AS admin_last
         FROM admin_actions a
         LEFT JOIN users u ON u.id = a.admin_id
         ${where}
         ORDER BY a.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, perPage, offset]
      ),
      db.query(`SELECT count(*)::int AS n FROM admin_actions a ${where}`, params),
    ]);

    res.json({ actions: list.rows, total: total.rows[0].n, page, perPage });
  })
);

// ---------------------------------------------------------------------------
// Users: suspend / reinstate
// ---------------------------------------------------------------------------
router.patch(
  "/users/:id/ban",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) throw err("Invalid user id", 400);
    if (id === req.user.id) throw err("You cannot suspend yourself", 400);
    const reason = String(req.body?.reason || "").trim().slice(0, 255);

    const upd = await db.query(
      `UPDATE users SET banned_at = now(), banned_reason = $1, updated_at = now()
       WHERE id = $2 AND banned_at IS NULL
       RETURNING id, email, banned_at, banned_reason`,
      [reason, id]
    );
    if (upd.rowCount === 0) {
      const exists = await db.query("SELECT id FROM users WHERE id = $1", [id]);
      if (exists.rowCount === 0) throw err("User not found", 404);
      throw err("User is already suspended", 400);
    }

    await logAdminAction({
      adminId: req.user.id,
      action: "user.ban",
      targetType: "user",
      targetId: id,
      data: { reason, email: upd.rows[0].email },
      ip: req.ip,
    });
    res.json({ user: upd.rows[0] });
  })
);

router.patch(
  "/users/:id/unban",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) throw err("Invalid user id", 400);

    const upd = await db.query(
      `UPDATE users SET banned_at = NULL, banned_reason = '', updated_at = now()
       WHERE id = $1 AND banned_at IS NOT NULL
       RETURNING id, email`,
      [id]
    );
    if (upd.rowCount === 0) {
      const exists = await db.query("SELECT id FROM users WHERE id = $1", [id]);
      if (exists.rowCount === 0) throw err("User not found", 404);
      throw err("User is not suspended", 400);
    }

    await logAdminAction({
      adminId: req.user.id,
      action: "user.unban",
      targetType: "user",
      targetId: id,
      data: { email: upd.rows[0].email },
      ip: req.ip,
    });
    res.json({ user: upd.rows[0] });
  })
);

// ---------------------------------------------------------------------------
// Listings moderation
// ---------------------------------------------------------------------------
const LISTING_STATUSES = ["draft", "published", "paused", "suspended", "deleted"];

router.get(
  "/listings",
  asyncHandler(async (req, res) => {
    const { page, perPage, offset } = paginate(req.query.page, req.query.perPage || 25);
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim();
    const conds = [];
    const params = [];
    if (q) {
      params.push(`%${q}%`);
      const i = params.length;
      conds.push(`(l.title ILIKE $${i} OR u.email ILIKE $${i} OR u.first_name ILIKE $${i} OR u.last_name ILIKE $${i})`);
    }
    if (LISTING_STATUSES.includes(status)) {
      params.push(status);
      conds.push(`l.status = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const [list, total] = await Promise.all([
      db.query(
        `SELECT l.id, l.title, l.slug, l.status, l.verification_status, l.promotion_tier, l.promotion_until,
                l.price_daily, l.price_hourly, l.currency, l.view_count, l.favorite_count, l.created_at,
                l.owner_id, u.email AS owner_email,
                u.first_name AS owner_first, u.last_name AS owner_last
         FROM listings l
         LEFT JOIN users u ON u.id = l.owner_id
         ${where}
         ORDER BY l.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, perPage, offset]
      ),
      db.query(
        `SELECT count(*)::int AS n FROM listings l
         LEFT JOIN users u ON u.id = l.owner_id ${where}`,
        params
      ),
    ]);

    res.json({ listings: list.rows, total: total.rows[0].n, page, perPage });
  })
);

router.patch(
  "/listings/:id/status",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const status = req.body?.status;
    if (!id) throw err("Invalid listing id", 400);
    if (!LISTING_STATUSES.includes(status)) throw err(`status must be one of: ${LISTING_STATUSES.join(", ")}`, 400);

    const upd = await db.query(
      `UPDATE listings SET status = $1, updated_at = now() WHERE id = $2
       RETURNING id, title, status`,
      [status, id]
    );
    if (upd.rowCount === 0) throw err("Listing not found", 404);

    await logAdminAction({
      adminId: req.user.id,
      action: "listing.status",
      targetType: "listing",
      targetId: id,
      data: { status, title: upd.rows[0].title },
      ip: req.ip,
    });
    res.json({ listing: upd.rows[0] });
  })
);

router.delete(
  "/listings/:id",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) throw err("Invalid listing id", 400);

    const upd = await db.query(
      `UPDATE listings SET status = 'deleted', updated_at = now()
       WHERE id = $1 AND status <> 'deleted'
       RETURNING id, title`,
      [id]
    );
    if (upd.rowCount === 0) throw err("Listing not found", 404);

    await logAdminAction({
      adminId: req.user.id,
      action: "listing.delete",
      targetType: "listing",
      targetId: id,
      data: { title: upd.rows[0].title },
      ip: req.ip,
    });
    res.json({ ok: true });
  })
);

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------
const BOOKING_STATUSES = ["pending", "approved", "payment_pending", "active", "returned", "completed", "cancelled", "rejected"];

router.get(
  "/bookings",
  asyncHandler(async (req, res) => {
    const { page, perPage, offset } = paginate(req.query.page, req.query.perPage || 25);
    const status = String(req.query.status || "").trim();
    const conds = [];
    const params = [];
    if (BOOKING_STATUSES.includes(status)) {
      params.push(status);
      conds.push(`b.status = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const [list, total] = await Promise.all([
      db.query(
        `SELECT b.id, b.status, b.payment_status, b.pickup_status, b.return_status,
                b.total, b.currency, b.start_time, b.end_time, b.created_at,
                b.renter_id, b.owner_id, b.listing_id,
                l.title AS listing_title,
                ro.email AS renter_email, ro.first_name AS renter_first, ro.last_name AS renter_last,
                oo.email AS owner_email, oo.first_name AS owner_first, oo.last_name AS owner_last
         FROM bookings b
         LEFT JOIN listings l ON l.id = b.listing_id
         LEFT JOIN users ro ON ro.id = b.renter_id
         LEFT JOIN users oo ON oo.id = b.owner_id
         ${where}
         ORDER BY b.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, perPage, offset]
      ),
      db.query(`SELECT count(*)::int AS n FROM bookings b ${where}`, params),
    ]);

    res.json({ bookings: list.rows, total: total.rows[0].n, page, perPage });
  })
);

// ---------------------------------------------------------------------------
// Payments: booking transactions + the credit ledger
// ---------------------------------------------------------------------------
router.get(
  "/transactions",
  asyncHandler(async (req, res) => {
    const { page, perPage, offset } = paginate(req.query.page, req.query.perPage || 30);
    const status = String(req.query.status || "").trim();
    const conds = [];
    const params = [];
    if (["pending", "authorized", "paid", "failed", "refunded", "partially_refunded"].includes(status)) {
      params.push(status);
      conds.push(`t.status = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const [list, total] = await Promise.all([
      db.query(
        `SELECT t.id, t.booking_id, t.payer_id, t.receiver_id, t.amount, t.platform_fee, t.owner_amount,
                t.currency, t.status, t.provider_reference, t.created_at,
                p.email AS payer_email, r.email AS receiver_email
         FROM transactions t
         LEFT JOIN users p ON p.id = t.payer_id
         LEFT JOIN users r ON r.id = t.receiver_id
         ${where}
         ORDER BY t.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, perPage, offset]
      ),
      db.query(`SELECT count(*)::int AS n FROM transactions t ${where}`, params),
    ]);

    res.json({ transactions: list.rows, total: total.rows[0].n, page, perPage });
  })
);

router.get(
  "/credit-ledger",
  asyncHandler(async (req, res) => {
    const { page, perPage, offset } = paginate(req.query.page, req.query.perPage || 30);
    const type = String(req.query.type || "").trim();
    const conds = [];
    const params = [];
    if (["purchase", "slot", "boost", "renew", "addon", "adjustment"].includes(type)) {
      params.push(type);
      conds.push(`c.type = $${params.length}`);
    }
    const q = String(req.query.q || "").trim();
    if (q) {
      params.push(`%${q}%`);
      const i = params.length;
      conds.push(`(u.email ILIKE $${i} OR u.first_name ILIKE $${i} OR u.last_name ILIKE $${i})`);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const [list, total] = await Promise.all([
      db.query(
        `SELECT c.id, c.user_id, c.type, c.amount, c.description, c.listing_id, c.created_at,
                u.email AS user_email, u.first_name AS user_first, u.last_name AS user_last
         FROM credit_transactions c
         LEFT JOIN users u ON u.id = c.user_id
         ${where}
         ORDER BY c.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, perPage, offset]
      ),
      db.query(
        `SELECT count(*)::int AS n FROM credit_transactions c
         LEFT JOIN users u ON u.id = c.user_id ${where}`,
        params
      ),
    ]);

    res.json({ ledger: list.rows, total: total.rows[0].n, page, perPage });
  })
);

// ---------------------------------------------------------------------------
// CSV export (semicolon separated, UTF-8 BOM for Excel)
// ---------------------------------------------------------------------------
const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
const iso = (d) => (d ? new Date(d).toISOString() : "");

router.get(
  "/export/:kind.csv",
  asyncHandler(async (req, res) => {
    const kind = req.params.kind;
    let name;
    let sql;
    if (kind === "users") {
      name = "rento-notendur";
      sql = `SELECT id, email, first_name, last_name, city, role, credit_balance, extra_slots,
                    email_verified, identity_verified, banned_at, created_at
             FROM users ORDER BY created_at DESC`;
    } else if (kind === "credits") {
      name = "rento-kredit-faerslur";
      sql = `SELECT c.id, c.user_id, u.email, c.type, c.amount, c.description, c.listing_id, c.created_at
             FROM credit_transactions c LEFT JOIN users u ON u.id = c.user_id
             ORDER BY c.created_at DESC`;
    } else if (kind === "transactions") {
      name = "rento-greidslur";
      sql = `SELECT t.id, t.booking_id, t.amount, t.platform_fee, t.owner_amount, t.currency,
                    t.status, t.provider_reference, t.created_at
             FROM transactions t ORDER BY t.created_at DESC`;
    } else {
      throw err("Unknown export kind", 400);
    }

    const { rows } = await db.query(sql);
    res.set("Content-Type", "text/csv; charset=utf-8");
    if (rows.length === 0) return res.send("\uFEFF");
    const cols = Object.keys(rows[0]);
    const body = [cols, ...rows.map((r) => cols.map((c) => (c === "created_at" || c === "banned_at" ? iso(r[c]) : r[c])))];
    res.set("Content-Disposition", `attachment; filename="${name}.csv"`);
    res.send(`\uFEFF${toCsv(body)}`);
  })
);

// ---------------------------------------------------------------------------
// Contact inbox
// ---------------------------------------------------------------------------
router.get(
  "/messages",
  asyncHandler(async (req, res) => {
    const { page, perPage, offset } = paginate(req.query.page, req.query.perPage || 30);
    const status = String(req.query.status || "").trim();
    const conds = [];
    const params = [];
    if (status === "new" || status === "answered") {
      params.push(status);
      conds.push(`m.status = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const [list, total, unread] = await Promise.all([
      db.query(
        `SELECT m.id, m.name, m.email, m.subject, m.message, m.status, m.ip,
                m.created_at, m.answered_at, m.answered_by, ua.email AS answered_by_email
         FROM contact_messages m
         LEFT JOIN users ua ON ua.id = m.answered_by
         ${where}
         ORDER BY m.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, perPage, offset]
      ),
      db.query(`SELECT count(*)::int AS n FROM contact_messages m ${where}`, params),
      db.query(`SELECT count(*)::int AS n FROM contact_messages WHERE status = 'new'`),
    ]);

    res.json({ messages: list.rows, total: total.rows[0].n, unread: unread.rows[0].n, page, perPage });
  })
);

router.patch(
  "/messages/:id/answer",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) throw err("Invalid message id", 400);

    const upd = await db.query(
      `UPDATE contact_messages
       SET status = 'answered', answered_at = now(), answered_by = $1
       WHERE id = $2 AND status = 'new'
       RETURNING id, status`,
      [req.user.id, id]
    );
    if (upd.rowCount === 0) {
      const exists = await db.query("SELECT id FROM contact_messages WHERE id = $1", [id]);
      if (exists.rowCount === 0) throw err("Message not found", 404);
      throw err("Message is already answered", 400);
    }

    await logAdminAction({
      adminId: req.user.id,
      action: "contact.answer",
      targetType: "message",
      targetId: id,
      ip: req.ip,
    });
    res.json({ message: upd.rows[0] });
  })
);

// ---------------------------------------------------------------------------
// Credit fraud: alerts + on-demand scan
// ---------------------------------------------------------------------------
router.get(
  "/alerts",
  asyncHandler(async (req, res) => {
    const { page, perPage, offset } = paginate(req.query.page, req.query.perPage || 30);
    const status = String(req.query.status || "").trim();
    const rule = String(req.query.rule || "").trim();
    const conds = [];
    const params = [];
    if (["open", "reviewed", "dismissed"].includes(status)) {
      params.push(status);
      conds.push(`a.status = $${params.length}`);
    }
    if (rule && creditGuard.RULES[rule]) {
      params.push(rule);
      conds.push(`a.rule = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const [list, total, counts] = await Promise.all([
      db.query(
        `SELECT a.id, a.rule, a.severity, a.user_id, a.listing_id, a.amount, a.ip,
                a.detail, a.status, a.created_at, a.reviewed_at, a.reviewed_by,
                u.email AS user_email, u.first_name AS user_first, u.last_name AS user_last,
                rv.email AS reviewed_by_email
         FROM credit_alerts a
         LEFT JOIN users u ON u.id = a.user_id
         LEFT JOIN users rv ON rv.id = a.reviewed_by
         ${where}
         ORDER BY a.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, perPage, offset]
      ),
      db.query(`SELECT count(*)::int AS n FROM credit_alerts a ${where}`, params),
      db.query(
        `SELECT count(*) FILTER (WHERE status = 'open')::int AS open,
                count(*) FILTER (WHERE status = 'reviewed')::int AS reviewed,
                count(*) FILTER (WHERE status = 'dismissed')::int AS dismissed,
                count(*) FILTER (WHERE status = 'open' AND severity = 'critical')::int AS critical
         FROM credit_alerts`
      ),
    ]);

    res.json({
      alerts: list.rows,
      total: total.rows[0].n,
      page,
      perPage,
      counts: counts.rows[0],
      rules: creditGuard.RULES,
    });
  })
);

router.patch(
  "/alerts/:id/status",
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const status = req.body?.status;
    if (!id) throw err("Invalid alert id", 400);
    if (status !== "reviewed" && status !== "dismissed") throw err("status must be reviewed or dismissed", 400);

    const upd = await db.query(
      `UPDATE credit_alerts SET status = $1, reviewed_at = now(), reviewed_by = $2
       WHERE id = $3 AND status = 'open'
       RETURNING id, status, rule`,
      [status, req.user.id, id]
    );
    if (upd.rowCount === 0) {
      const exists = await db.query("SELECT id, status FROM credit_alerts WHERE id = $1", [id]);
      if (exists.rowCount === 0) throw err("Alert not found", 404);
      throw err("Alert is already handled", 400);
    }

    await logAdminAction({
      adminId: req.user.id,
      action: `credit.alert_${status}`,
      targetType: "alert",
      targetId: id,
      data: { rule: upd.rows[0].rule },
      ip: req.ip,
    });
    res.json({ alert: upd.rows[0] });
  })
);

router.post(
  "/credits/scan",
  asyncHandler(async (req, res) => {
    const result = await creditGuard.scan();
    await logAdminAction({
      adminId: req.user.id,
      action: "credit.scan",
      targetType: null,
      targetId: null,
      data: result,
      ip: req.ip,
    });
    res.json(result);
  })
);

// ---------------------------------------------------------------------------
// Credit purchases (the "payments" side of kredit packages)
// ---------------------------------------------------------------------------
router.get(
  "/credit-payments",
  asyncHandler(async (req, res) => {
    const { page, perPage, offset } = paginate(req.query.page, req.query.perPage || 30);
    const status = String(req.query.status || "").trim();
    const conds = [];
    const params = [];
    if (["pending", "paid", "failed"].includes(status)) {
      params.push(status);
      conds.push(`p.status = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

    const [list, total, sums] = await Promise.all([
      db.query(
        `SELECT p.id, p.user_id, p.package_id, p.credits, p.amount, p.currency, p.status,
                p.provider_reference, p.created_at,
                u.email AS user_email, u.first_name AS user_first, u.last_name AS user_last
         FROM credit_payments p
         LEFT JOIN users u ON u.id = p.user_id
         ${where}
         ORDER BY p.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, perPage, offset]
      ),
      db.query(`SELECT count(*)::int AS n FROM credit_payments p ${where}`, params),
      db.query(
        `SELECT COALESCE(sum(amount), 0) AS revenue, COALESCE(sum(credits), 0) AS credits,
                count(*)::int AS n
         FROM credit_payments WHERE status = 'paid'`
      ),
    ]);

    res.json({
      payments: list.rows,
      total: total.rows[0].n,
      page,
      perPage,
      summary: {
        revenue: Number(sums.rows[0].revenue),
        credits: sums.rows[0].credits,
        count: sums.rows[0].n,
      },
    });
  })
);

// GET /api/admin/visitors -> visitor counters for the overview tab.
// "online" = distinct sessions seen in the last 5 minutes (client heartbeats
// every 60s while the tab is open).
router.get(
  "/visitors",
  asyncHandler(async (req, res) => {
    const [counts, series] = await Promise.all([
      db.query(
        `SELECT
           count(DISTINCT session_id) FILTER (WHERE created_at > now() - interval '5 minutes')::int AS online,
           count(DISTINCT session_id) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS today,
           count(DISTINCT session_id) FILTER (WHERE created_at > now() - interval '7 days')::int AS week,
           count(DISTINCT session_id) FILTER (WHERE created_at > now() - interval '30 days')::int AS month,
           count(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS views_today,
           count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS views_week,
           count(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS views_month,
           count(DISTINCT session_id)::int AS total_sessions
         FROM page_visits`
      ),
      db.query(
        `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
                count(DISTINCT session_id)::int AS visitors,
                count(*)::int AS views
         FROM page_visits
         WHERE created_at > now() - interval '30 days'
         GROUP BY 1 ORDER BY 1`
      ),
    ]);

    res.json({ ...counts.rows[0], series: series.rows });
  })
);

// GET /api/admin/password-resets -> recent forgot-password requests.
router.get(
  "/password-resets",
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT pr.id, pr.user_id, pr.created_at, pr.expires_at, pr.used_at, pr.emailed_at,
              u.email, u.first_name, u.last_name
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.created_at > now() - interval '30 days'
       ORDER BY pr.created_at DESC
       LIMIT 200`
    );
    res.json({ resets: rows });
  })
);

// POST /api/admin/password-resets/:id/link -> generate a fresh 60-minute
// one-time reset link for the user behind this request. The admin sends it to
// the user manually (email/phone) - used while no mail provider is configured.
router.post(
  "/password-resets/:id/link",
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT pr.id, pr.user_id, u.email
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.id = $1`,
      [req.params.id]
    );
    if (!rows.length) throw err("Reset request not found", 404);

    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    await db.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at, ip)
       VALUES ($1, $2, now() + interval '60 minutes', $3)`,
      [rows[0].user_id, hash, req.ip]
    );

    let base = (config.webOrigin || "").replace(/\/+$/, "");
    if (!base) base = "https://www.rento.is";
    try {
      const u = new URL(base);
      const local = /^(localhost|127\.0\.0\.1)$/.test(u.hostname);
      base = local ? "https://www.rento.is" : `https://${u.hostname}`;
    } catch (e) {
      if (/localhost|127\.0\.0\.1/.test(base)) base = "https://www.rento.is";
    }
    const link = `${base}/reset-password?token=${encodeURIComponent(token)}`;

    await logAdminAction({
      adminId: req.user.id,
      action: "password.link",
      targetType: "user",
      targetId: rows[0].user_id,
      data: { email: rows[0].email },
      ip: req.ip,
    });

    res.json({ link, email: rows[0].email, expiresInMinutes: 60 });
  })
);

module.exports = router;
