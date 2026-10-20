const db = require("../db/pool");

// Every user may keep 3 listings published at the same time, free.
const FREE_SLOTS = 3;

// A paid slot covers one listing for 30 days.
const AD_DAYS = 30;
const SLOT_PRICE = 490;
const SLOT_PACKAGES = {
  pkg3: { slots: 3, amount: 1290 },
  pkg5: { slots: 5, amount: 1990 },
  pkg10: { slots: 10, amount: 3490 },
};

// Promotions are bought per already-published listing, paid directly in ISK.
const PROMO_PRICES = {
  silver: { amount: 1290, days: 7 },
  gold: { amount: 1990, days: 14 },
  platinum: { amount: 2990, days: 30 },
};

// Mark listings whose 30-day run is over as expired and drop the paid slots
// they held (rule: when the ad expires, the bought slot disappears).
async function expireListings() {
  await db.query(`
    WITH expired AS (
      UPDATE listings
         SET status = 'expired', updated_at = now()
       WHERE status = 'published'
         AND expires_at IS NOT NULL
         AND expires_at <= now()
      RETURNING id
    )
    DELETE FROM listing_slots WHERE listing_id IN (SELECT id FROM expired)
  `);
}

async function activeListingCount(userId, excludeId) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS n
       FROM listings
      WHERE owner_id = $1
        AND status = 'published'
        AND (expires_at IS NULL OR expires_at > now())
        AND ($2::int IS NULL OR id <> $2)`,
    [userId, excludeId || null]
  );
  return rows[0].n;
}

// Reserve capacity for one more published listing:
// "free" when one of the 3 free slots is available, otherwise one available
// bought slot is marked as used, otherwise "none".
async function reserveSlotForPublish(userId, excludeId) {
  const active = await activeListingCount(userId, excludeId);
  if (active < FREE_SLOTS) return { mode: "free" };
  const { rows } = await db.query(
    `UPDATE listing_slots
        SET used_at = now()
      WHERE id = (
        SELECT id FROM listing_slots
         WHERE user_id = $1 AND used_at IS NULL
         ORDER BY purchased_at, id
         LIMIT 1
      )
      RETURNING id`,
    [userId]
  );
  if (!rows.length) return { mode: "none" };
  return { mode: "slot", slotId: rows[0].id };
}

async function attachSlot(slotId, listingId) {
  await db.query(
    `UPDATE listing_slots
        SET listing_id = $1,
            expires_at = (SELECT expires_at FROM listings WHERE id = $1)
      WHERE id = $2`,
    [listingId, slotId]
  );
}

// A listing that stops being published gives its paid slot back as available.
async function releaseSlotForListing(listingId) {
  await db.query(
    `UPDATE listing_slots
        SET used_at = NULL, listing_id = NULL, expires_at = NULL
      WHERE listing_id = $1`,
    [listingId]
  );
}

// Email + in-app reminder when a published listing is about to expire.
async function sendExpiryReminders() {
  const { rows } = await db.query(
    `SELECT l.id, l.title, l.slug, l.owner_id, l.expires_at
       FROM listings l
      WHERE l.status = 'published'
        AND l.expires_at IS NOT NULL
        AND l.expires_at > now()
        AND l.expires_at <= now() + interval '3 days'
        AND l.expiry_reminder_sent_at IS NULL
      LIMIT 200`
  );
  if (!rows.length) return 0;
  const { notify } = require("./notify");
  for (const l of rows) {
    await notify(
      l.owner_id,
      "listing_expiring",
      "Auglýsingin rennur út",
      `„${l.title}“ rennur út ${new Date(l.expires_at).toLocaleDateString("is-IS")}. Þú getur endurbirt hana úr stjórnborðinu.`,
      { listingId: l.id, slug: l.slug }
    );
    await db.query("UPDATE listings SET expiry_reminder_sent_at = now() WHERE id = $1", [l.id]);
  }
  return rows.length;
}

module.exports = {
  FREE_SLOTS,
  AD_DAYS,
  SLOT_PRICE,
  SLOT_PACKAGES,
  PROMO_PRICES,
  expireListings,
  activeListingCount,
  reserveSlotForPublish,
  attachSlot,
  releaseSlotForListing,
  sendExpiryReminders,
};
