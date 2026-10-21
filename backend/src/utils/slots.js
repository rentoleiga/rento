const db = require("../db/pool");

const fmtDate = (iso) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Atlantic/Reykjavik",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));

const fmtDateTime = (iso) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Atlantic/Reykjavik",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(",", "");

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
        AND l.expires_at <= now() + interval '1 day'
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
      `„${l.title}“ rennur út ${fmtDate(l.expires_at)}. Þú getur endurbirt hana úr stjórnborðinu.`,
      { listingId: l.id, slug: l.slug }
    );
    await db.query("UPDATE listings SET expiry_reminder_sent_at = now() WHERE id = $1", [l.id]);
  }
  return rows.length;
}

// Reminder before a booking is due back. Short rentals (up to 24 hours) get
// the reminder one hour before, longer rentals one day before.
async function sendReturnReminders() {
  const { rows } = await db.query(
    `SELECT b.id, b.listing_id, b.renter_id, b.owner_id, b.start_time, b.end_time,
            l.title, l.slug
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
      WHERE b.status IN ('approved', 'active')
        AND b.return_status = 'pending'
        AND b.end_time > now()
        AND b.end_time <= now() + CASE
          WHEN b.end_time - b.start_time <= interval '24 hours' THEN interval '1 hour'
          ELSE interval '1 day'
        END
        AND b.return_reminder_sent_at IS NULL
      LIMIT 300`
  );
  if (!rows.length) return 0;
  const { notify } = require("./notify");
  for (const b of rows) {
    const shortRental = new Date(b.end_time) - new Date(b.start_time) <= 24 * 60 * 60 * 1000;
    const extension = shortRental ? "1 hour" : "1 day";
    const conflict = await db.query(
      `SELECT 1 FROM availability
        WHERE listing_id = $1
          AND status IN ('blocked','booked','maintenance')
          AND start_time < $2::timestamptz + $3::interval
          AND end_time > $2::timestamptz
        LIMIT 1`,
      [b.listing_id, b.end_time, extension]
    );
    const canExtend = conflict.rowCount === 0;
    const due = `„${b.title}“ á að skila ${fmtDateTime(b.end_time)}.`;
    const renterBody = `${due} ${
      canExtend
        ? `Tíminn er laus hjá útgefanda, svo þú getur framlengt bókunina um ${shortRental ? "klukkustund" : "dag"}.`
        : "Hafðu samband við útgefandann ef þú þarft að framlengja."
    }`;
    const ownerBody = `${due} ${
      canExtend
        ? `Tíminn er laus, svo leigjandi getur framlengt bókunina um ${shortRental ? "klukkustund" : "dag"}.`
        : "Leigjandi þarf að hafa samband við þig ef framlengja á bókunina."
    }`;
    await notify(b.renter_id, "return_reminder", "Skilafrestur nálgast", renterBody, {
      bookingId: b.id,
      listingId: b.listing_id,
      slug: b.slug,
    });
    await notify(b.owner_id, "return_reminder", "Skilafrestur nálgast", ownerBody, {
      bookingId: b.id,
      listingId: b.listing_id,
      slug: b.slug,
    });
    await db.query("UPDATE bookings SET return_reminder_sent_at = now() WHERE id = $1", [b.id]);
  }
  return rows.length;
}

// Keep notification history for 90 days (spec: 30–90 days).
async function cleanupOldNotifications() {
  const { rowCount } = await db.query(
    "DELETE FROM notifications WHERE created_at < now() - interval '90 days'"
  );
  return rowCount;
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
  sendReturnReminders,
  cleanupOldNotifications,
};
