const { Router } = require("express");
const db = require("../db/pool");
const { authRequired } = require("../middleware/auth");
const { asyncHandler, err } = require("../middleware/http");

const router = Router();

const PACKAGES = {
  litill: { credits: 5, price: 990, label: "Litill" },
  vinsaell: { credits: 15, price: 2490, label: "Vinsæll" },
  stor: { credits: 35, price: 4990, label: "Stór" },
  fyrirtaeki: { credits: 80, price: 9990, label: "Fyrirtæki" },
};

const BOOSTS = {
  silver: { credits: 2, days: 7, label: "Silver" },
  gold: { credits: 4, days: 14, label: "Gold" },
  platinum: { credits: 7, days: 30, label: "Platinum" },
};

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
    const [me, tx] = await Promise.all([
      db.query("SELECT credit_balance, extra_slots FROM users WHERE id = $1", [req.user.id]),
      db.query(
        "SELECT * FROM credit_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
        [req.user.id]
      ),
    ]);
    res.json({
      balance: me.rows[0]?.credit_balance || 0,
      extraSlots: me.rows[0]?.extra_slots || 0,
      packages: PACKAGES,
      boosts: BOOSTS,
      transactions: tx.rows.map(mapTx),
    });
  })
);

// POST /api/credits/purchase { packageId }  (no real payment yet - adds credits)
router.post(
  "/purchase",
  authRequired,
  asyncHandler(async (req, res) => {
    const pkg = PACKAGES[req.body?.packageId];
    if (!pkg) throw err("Unknown credit package", 400);

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const upd = await client.query(
        "UPDATE users SET credit_balance = credit_balance + $1, updated_at = now() WHERE id = $2 RETURNING credit_balance",
        [pkg.credits, req.user.id]
      );
      await client.query(
        `INSERT INTO credit_transactions (user_id, type, amount, description)
         VALUES ($1, 'purchase', $2, $3)`,
        [req.user.id, pkg.credits, `Keypt ${pkg.label} pakki (${pkg.price} kr.)`]
      );
      await client.query("COMMIT");
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
      if ((cur.rows[0]?.credit_balance || 0) < count) throw err("Not enough credit", 400);
      const upd = await client.query(
        "UPDATE users SET credit_balance = credit_balance - $1, extra_slots = extra_slots + $1, updated_at = now() WHERE id = $2 RETURNING credit_balance, extra_slots",
        [count, req.user.id]
      );
      await client.query(
        `INSERT INTO credit_transactions (user_id, type, amount, description)
         VALUES ($1, 'slot', $2, $3)`,
        [req.user.id, -count, `${count} varanleg aukapláss`]
      );
      await client.query("COMMIT");
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

      await client.query(
        "UPDATE users SET credit_balance = credit_balance - $1, updated_at = now() WHERE id = $2",
        [boost.credits, req.user.id]
      );
      const until = await client.query(
        `UPDATE listings
           SET promotion_tier = $1,
               promotion_until = now() + ($2 || ' days')::interval,
               updated_at = now()
         WHERE id = $3
         RETURNING promotion_tier, promotion_until`,
        [req.body.tier, String(boost.days), listingId]
      );
      const upd = await client.query("SELECT credit_balance FROM users WHERE id = $1", [req.user.id]);
      await client.query(
        `INSERT INTO credit_transactions (user_id, type, amount, description, listing_id)
         VALUES ($1, 'boost', $2, $3, $4)`,
        [req.user.id, -boost.credits, `${boost.label} boost (${boost.days} dagar)`, listingId]
      );
      await client.query("COMMIT");
      res.json({
        balance: upd.rows[0].credit_balance,
        promotionTier: until.rows[0].promotion_tier,
        promotionUntil: until.rows[0].promotion_until,
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
