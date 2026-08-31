const db = require("../db/pool");

/**
 * Check whether a requested period is bookable for a listing.
 * Spec section 14 rules:
 *   - A period is blocked if it overlaps any blocked/booked/maintenance record.
 *   - If the owner defined AVAILABLE windows, the requested period must be
 *     fully contained within at least one such window.
 *   - If no AVAILABLE windows are defined, the timeline is open except for
 *     blocked/booked/maintenance periods.
 */
async function checkAvailability(listingId, start, end, excludeBookingId = null) {
  const overlaps = await db.query(
    `SELECT id, status,
            to_char(start_time, 'YYYY-MM-DD HH24:MI') AS start_time,
            to_char(end_time, 'YYYY-MM-DD HH24:MI') AS end_time
     FROM availability
     WHERE listing_id = $1
       AND status IN ('blocked', 'booked', 'maintenance')
       AND start_time < $3
       AND end_time > $2
       AND ($4::int IS NULL OR booking_id IS DISTINCT FROM $4)
     ORDER BY start_time`,
    [listingId, start, end, excludeBookingId]
  );

  if (overlaps.rowCount > 0) {
    return {
      available: false,
      reason: "overlap",
      conflicts: overlaps.rows,
    };
  }

  const windows = await db.query(
    `SELECT id, status, start_time, end_time
     FROM availability
     WHERE listing_id = $1 AND status = 'available'
     ORDER BY start_time`,
    [listingId]
  );

  if (windows.rowCount === 0) {
    return { available: true, reason: "open", conflicts: [] };
  }

  const sDate = new Date(start);
  const eDate = new Date(end);

  const contained = windows.rows.find(
    (w) => new Date(w.start_time).getTime() <= sDate.getTime()
      && new Date(w.end_time).getTime() >= eDate.getTime()
  );
  if (contained) {
    return { available: true, reason: "window", window: contained, conflicts: [] };
  }

  const covering = windows.rows.find(
    (w) => new Date(w.start_time).getTime() <= sDate.getTime()
      && new Date(w.end_time).getTime() > sDate.getTime()
  );
  return {
    available: false,
    reason: "window-mismatch",
    conflicts: [],
    hint: covering || windows.rows[0],
  };
}

module.exports = { checkAvailability };