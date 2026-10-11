const { Router } = require("express");
const db = require("../db/pool");
const { authRequired, adminRequired } = require("../middleware/auth");
const { asyncHandler, err } = require("../middleware/http");
const { paginate } = require("../utils/helpers");
const { logAdminAction } = require("../utils/adminLog");

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

module.exports = router;
