const { Router } = require("express");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler, err } = require("../middleware/http");
const { logAdminAction } = require("../utils/adminLog");
const creditGuard = require("../services/creditGuard");

const router = Router();

// 1 kredit = 1 kr. Packages are fixed top-up amounts (like phone credit).
const PACKAGES = {
  litill: { credits: 999, price: 999, label: "Litill" },
  vinsaell: { credits: 2700, price: 2499, label: "Vinsæll" },
  stor: { credits: 5800, price: 4999, label: "Stór" },
  fyrirtaeki: { credits: 12000, price: 9999, label: "Fyrirtæki" },
};

const BOOSTS = {
  silver: { credits: 150, days: 7, label: "Silver" },
  gold: { credits: 590, days: 14, label: "Gold" },
  platinum: { credits: 1250, days: 30, label: "Platinum" },
};

// Paid one-time add-ons. Active only while the listing's promotion runs.
const ADDONS = {
  highlight: { credits: 90, label: "Áberandi" },
  link: { credits: 60, label: "Tengill" },
  video: { credits: 120, label: "Myndband" },
};

// Obnova (renewal): half of the tier price, full period restarted from now.
const RENEW = {
  silver: { credits: 75, days: 7, label: "Silver" },
  featured: { credits: 75, days: 7, label: "Silver" },
  gold: { credits: 295, days: 14, label: "Gull" },
  platinum: { credits: 625, days: 30, label: "Platína" },
};

// Golden upgrade: after GOLDEN_REQUIRED_BOOSTS paid boosts inside 30 days the
// next boost is upgraded to "Gyllt" free of charge (the tier still applies).
const GOLDEN_REQUIRED_BOOSTS = 10;

// A permanent extra listing slot costs 249 kredit.
const SLOT_COST = 249;

function assertWebUrl(v, field) {
  const s = String(v || "").trim();
  if (!s) throw err(`${field} required`, 400);
  if (s.length > 500) throw err(`${field} too long (max 500)`, 400);
  if (!/^https?:\/\/\S+$/i.test(s)) throw err(`${field} must be an http(s) URL`, 400);
  return s;
}

function mapTx(r) {
  return {
    id: r.id,
    type: r.type,
    amount: r.amount,
    description: r.description,
    listingId: r.listing_id,
    createdAt: r.created_at,
  };
}

// GET /api/credits -> balance, extra slots, recent transactions
router.get(
  "/",
  authRequired,
  asyncHandler(async (req, res) => {
    const [me, tx, recent] = await Promise.all([
      db.query("SELECT credit_balance, extra_slots FROM users WHERE id = $1", [req.user.id]),
      db.query(
        "SELECT * FROM credit_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
        [req.user.id]
      ),
      db.query(
        `SELECT count(*)::int AS n FROM credit_transactions
         WHERE user_id = $1 AND type = 'boost' AND created_at > now() - interval '30 days'`,
        [req.user.id]
      ),
    ]);
    res.json({
      balance: me.rows[0]?.credit_balance || 0,
      extraSlots: me.rows[0]?.extra_slots || 0,
      slotCost: SLOT_COST,
      packages: PACKAGES,
      boosts: BOOSTS,
      addons: ADDONS,
      renewCosts: Object.fromEntries(Object.entries(RENEW).map(([k, v]) => [k, v.credits])),
      goldenRequired: GOLDEN_REQUIRED_BOOSTS,
      recentBoosts: recent.rows[0]?.n || 0,
      transactions: tx.rows.map(mapTx),
    });
  })
);

// POST /api/credits/purchase { packageId }  (no real payment yet - adds credits)
// Guarded by a rate limit and recorded in credit_payments so every grant has a trail.
router.post(
  "/purchase",
  authRequired,
  asyncHandler(async (req, res) => {
    const pkg = PACKAGES[req.body?.packageId];
    if (!pkg) throw err("Unknown credit package", 400);

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      await creditGuard.assertPurchaseAllowed(client, req.user.id, req.ip);

      const upd = await client.query(
        "UPDATE users SET credit_balance = credit_balance + $1, updated_at = now() WHERE id = $2 RETURNING credit_balance",
        [pkg.credits, req.user.id]
      );
      await client.query(
        `INSERT INTO credit_payments (user_id, package_id, credits, amount, status, provider_reference)
         VALUES ($1, $2, $3, $4, 'paid', 'mock_payment')`,
        [req.user.id, req.body.packageId, pkg.credits, pkg.price]
      );
      await client.query(
        `INSERT INTO credit_transactions (user_id, type, amount, description, ip)
         VALUES ($1, 'purchase', $2, $3, $4)`,
        [req.user.id, pkg.credits, `Keypt ${pkg.label} pakki (${pkg.price} kr.)`, req.ip]
      );
      await client.query("COMMIT");
      await logAdminAction({
        adminId: null,
        action: "credit.purchase",
        targetType: "user",
        targetId: req.user.id,
        data: { packageId: req.body?.packageId, credits: pkg.credits, price: pkg.price },
        ip: req.ip,
      });
      creditGuard.quickChecks(req.user.id, req.ip).catch(() => {});
      res.status(201).json({ balance: upd.rows[0].credit_balance, credits: pkg.credits });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  })
);

// POST /api/credits/slots { count } -> buy permanent extra listing slots
router.post(
  "/slots",
  authRequired,
  asyncHandler(async (req, res) => {
    const count = parseInt(req.body?.count, 10);
    if (!count || count < 1 || count > 50) throw err("count must be 1-50", 400);

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const cur = await client.query("SELECT credit_balance FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
      const cost = count * SLOT_COST;
      if ((cur.rows[0]?.credit_balance || 0) < cost) throw err("Not enough credit", 400);
      const upd = await client.query(
        "UPDATE users SET credit_balance = credit_balance - $1, extra_slots = extra_slots + $2, updated_at = now() WHERE id = $3 RETURNING credit_balance, extra_slots",
        [cost, count, req.user.id]
      );
      await client.query(
        `INSERT INTO credit_transactions (user_id, type, amount, description, ip)
         VALUES ($1, 'slot', $2, $3, $4)`,
        [req.user.id, -cost, `${count} varanleg pláss (${cost} kredit)`, req.ip]
      );
      await client.query("COMMIT");
      await logAdminAction({
        adminId: null,
        action: "credit.slot",
        targetType: "user",
        targetId: req.user.id,
        data: { count, cost },
        ip: req.ip,
      });
      res.json({ balance: upd.rows[0].credit_balance, extraSlots: upd.rows[0].extra_slots });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  })
);

// POST /api/credits/boost { listingId, tier } -> promote a listing
router.post(
  "/boost",
  authRequired,
  asyncHandler(async (req, res) => {
    const boost = BOOSTS[req.body?.tier];
    const listingId = parseInt(req.body?.listingId, 10);
    if (!boost) throw err("Unknown boost tier", 400);
    if (!listingId) throw err("listingId required", 400);
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const own = await client.query("SELECT id FROM listings WHERE id = $1 AND owner_id = $2", [
        listingId,
        req.user.id,
      ]);
      if (own.rows.length === 0) throw err("Listing not found", 404);

      const cur = await client.query("SELECT credit_balance FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
      if ((cur.rows[0]?.credit_balance || 0) < boost.credits) throw err("Not enough credit", 400);

      // Golden upgrade: count paid boosts from the trailing 30 days BEFORE this
      // one is recorded. The 10th+ boost upgrades this activation to "Gyllt"
      // at no extra cost (the purchased tier still applies underneath).
      const counted = await client.query(
        `SELECT count(*)::int AS n FROM credit_transactions
         WHERE user_id = $1 AND type = 'boost' AND created_at > now() - interval '30 days'`,
        [req.user.id]
      );
      const golden = counted.rows[0].n >= GOLDEN_REQUIRED_BOOSTS;

      await client.query(
        "UPDATE users SET credit_balance = credit_balance - $1, updated_at = now() WHERE id = $2",
        [boost.credits, req.user.id]
      );
      const until = await client.query(
        `UPDATE listings
           SET promotion_tier = $1,
               promotion_until = now() + ($2 || ' days')::interval,
               golden_until = CASE WHEN $4::boolean THEN now() + ($2 || ' days')::interval ELSE golden_until END,
               updated_at = now()
         WHERE id = $3
         RETURNING promotion_tier, promotion_until, golden_until`,
        [req.body.tier, String(boost.days), listingId, golden]
      );
      const upd = await client.query("SELECT credit_balance FROM users WHERE id = $1", [req.user.id]);
      await client.query(
        `INSERT INTO credit_transactions (user_id, type, amount, description, listing_id, ip)
         VALUES ($1, 'boost', $2, $3, $4, $5)`,
        [
          req.user.id,
          -boost.credits,
          golden
            ? `${boost.label} boost (${boost.days} dagar) — Gyllt uppgradering`
            : `${boost.label} boost (${boost.days} dagar)`,
          listingId,
          req.ip,
        ]
      );
      await client.query("COMMIT");
      await logAdminAction({
        adminId: null,
        action: "credit.boost",
        targetType: "user",
        targetId: req.user.id,
        data: { tier: req.body.tier, credits: boost.credits, days: boost.days, listingId, golden },
        ip: req.ip,
      });
      res.json({
        balance: upd.rows[0].credit_balance,
        promotionTier: until.rows[0].promotion_tier,
        promotionUntil: until.rows[0].promotion_until,
        golden,
        goldenUntil: until.rows[0].golden_until,
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  })
);

// POST /api/credits/renew { listingId } -> Obnova: half the tier price,
// full period restarted from now, view count kept.
router.post(
  "/renew",
  authRequired,
  asyncHandler(async (req, res) => {
    const listingId = parseInt(req.body?.listingId, 10);
    if (!listingId) throw err("listingId required", 400);

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const own = await client.query(
        `SELECT id, promotion_tier, promotion_until FROM listings
         WHERE id = $1 AND owner_id = $2 FOR UPDATE`,
        [listingId, req.user.id]
      );
      if (own.rows.length === 0) throw err("Listing not found", 404);

      const row = own.rows[0];
      if (row.promotion_tier === "none" || !row.promotion_until || row.promotion_until <= new Date()) {
        throw err("Virk kynning er nauðsynleg til að endurnýja", 400);
      }
      const renew = RENEW[row.promotion_tier];
      if (!renew) throw err("Ekki hægt að endurnýja þessa kynningu", 400);

      const cur = await client.query("SELECT credit_balance FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
      if ((cur.rows[0]?.credit_balance || 0) < renew.credits) throw err("Not enough credit", 400);

      await client.query(
        "UPDATE users SET credit_balance = credit_balance - $1, updated_at = now() WHERE id = $2",
        [renew.credits, req.user.id]
      );
      const upd = await client.query(
        `UPDATE listings
           SET promotion_until = now() + ($1 || ' days')::interval,
               updated_at = now()
         WHERE id = $2
         RETURNING promotion_tier, promotion_until`,
        [String(renew.days), listingId]
      );
      const bal = await client.query("SELECT credit_balance FROM users WHERE id = $1", [req.user.id]);
      await client.query(
        `INSERT INTO credit_transactions (user_id, type, amount, description, listing_id, ip)
         VALUES ($1, 'renew', $2, $3, $4, $5)`,
        [req.user.id, -renew.credits, `Obnova: ${renew.label} (${renew.days} dagar)`, listingId, req.ip]
      );
      await client.query("COMMIT");
      await logAdminAction({
        adminId: null,
        action: "credit.renew",
        targetType: "user",
        targetId: req.user.id,
        data: { listingId, tier: row.promotion_tier, credits: renew.credits, days: renew.days },
        ip: req.ip,
      });
      res.json({
        balance: bal.rows[0].credit_balance,
        promotionTier: upd.rows[0].promotion_tier,
        promotionUntil: upd.rows[0].promotion_until,
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  })
);

// POST /api/credits/addons { listingId, highlight?, link?, video?, linkUrl?, videoUrl? }
// One-time purchase, active only while the listing's promotion runs.
router.post(
  "/addons",
  authRequired,
  asyncHandler(async (req, res) => {
    const listingId = parseInt(req.body?.listingId, 10);
    if (!listingId) throw err("listingId required", 400);

    const want = {
      highlight: !!req.body?.highlight,
      link: !!req.body?.link,
      video: !!req.body?.video,
    };
    if (!want.highlight && !want.link && !want.video) throw err("Enginn viðbót valin", 400);
    const linkUrl = want.link ? assertWebUrl(req.body?.linkUrl, "linkUrl") : null;
    const videoUrl = want.video ? assertWebUrl(req.body?.videoUrl, "videoUrl") : null;

    const items = Object.keys(want).filter((k) => want[k]);
    const cost = items.reduce((s, k) => s + ADDONS[k].credits, 0);

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const own = await client.query(
        `SELECT id, promotion_tier, promotion_until, addon_highlight, addon_link, addon_video
         FROM listings WHERE id = $1 AND owner_id = $2 FOR UPDATE`,
        [listingId, req.user.id]
      );
      if (own.rows.length === 0) throw err("Listing not found", 404);

      const row = own.rows[0];
      const promoActive = row.promotion_tier !== "none" && row.promotion_until && row.promotion_until > new Date();
      if (!promoActive) throw err("Virkjaðu fyrst kynningu til að bæta við viðbótum", 400);
      if (want.highlight && row.addon_highlight) throw err("Áberandi viðbót er þegar virk", 400);
      if (want.link && row.addon_link) throw err("Tengill er þegar í þessari skráningu", 400);
      if (want.video && row.addon_video) throw err("Myndband er þegar í þessari skráningu", 400);

      const cur = await client.query("SELECT credit_balance FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
      if ((cur.rows[0]?.credit_balance || 0) < cost) throw err("Not enough credit", 400);

      await client.query(
        "UPDATE users SET credit_balance = credit_balance - $1, updated_at = now() WHERE id = $2",
        [cost, req.user.id]
      );
      await client.query(
        `UPDATE listings
           SET addon_highlight = addon_highlight OR $2::boolean,
               addon_link = CASE WHEN $3::boolean THEN $4::text ELSE addon_link END,
               addon_video = CASE WHEN $5::boolean THEN $6::text ELSE addon_video END,
               updated_at = now()
         WHERE id = $1`,
        [listingId, want.highlight, want.link, linkUrl, want.video, videoUrl]
      );
      for (const k of items) {
        await client.query(
          `INSERT INTO credit_transactions (user_id, type, amount, description, listing_id, ip)
           VALUES ($1, 'addon', $2, $3, $4, $5)`,
          [req.user.id, -ADDONS[k].credits, `Viðbót: ${ADDONS[k].label}`, listingId, req.ip]
        );
      }
      const bal = await client.query("SELECT credit_balance FROM users WHERE id = $1", [req.user.id]);
      await client.query("COMMIT");
      await logAdminAction({
        adminId: null,
        action: "credit.addon",
        targetType: "user",
        targetId: req.user.id,
        data: { listingId, addons: items, credits: cost },
        ip: req.ip,
      });
      res.json({
        balance: bal.rows[0].credit_balance,
        addonHighlight: !!want.highlight || !!row.addon_highlight,
        addonLink: want.link ? linkUrl : row.addon_link,
        addonVideo: want.video ? videoUrl : row.addon_video,
        charged: cost,
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  })
);

module.exports = router;
