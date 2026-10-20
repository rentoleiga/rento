const db = require("../db/pool");
const { notify } = require("../utils/notify");

function matches(query, listing) {
  const q = query || {};
  if (q.keyword) {
    const hay = [
      listing.title,
      listing.subtitle,
      listing.description,
      listing.category_slug,
      listing.subcategory_slug,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const words = String(q.keyword).toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.every((w) => hay.includes(w))) return false;
  }
  if (q.category && listing.category_slug !== q.category && listing.subcategory_slug !== q.category) return false;
  if (q.subcategory && listing.subcategory_slug !== q.subcategory) return false;
  if (q.location && String(listing.city || "").toLowerCase() !== String(q.location).toLowerCase()) return false;
  const price = Number(listing.price_daily || (listing.price_hourly ? listing.price_hourly * 24 : 0));
  if (q.min_price != null && q.min_price !== "" && price < Number(q.min_price)) return false;
  if (q.max_price != null && q.max_price !== "" && price > Number(q.max_price)) return false;
  return true;
}

// Notify users whose saved search matches a freshly published listing.
async function notifySavedSearches(listingId) {
  try {
    const { rows } = await db.query(
      `SELECT l.id, l.title, l.subtitle, l.description, l.slug, l.city,
              l.price_daily, l.price_hourly,
              c.slug AS category_slug, sc.slug AS subcategory_slug
         FROM listings l
         LEFT JOIN categories c ON c.id = l.category_id
         LEFT JOIN categories sc ON sc.id = l.subcategory_id
        WHERE l.id = $1`,
      [listingId]
    );
    if (!rows.length) return;
    const listing = rows[0];
    const { rows: searches } = await db.query(
      `SELECT id, user_id, name, query FROM saved_searches
        WHERE last_notified_at IS NULL OR last_notified_at < now() - interval '20 hours'`
    );
    for (const s of searches) {
      if (!matches(s.query, listing)) continue;
      await notify(
        s.user_id,
        "saved_search_match",
        "Ný auglýsing passar við leitina þína",
        `„${listing.title}“ passar við vistaða leitina${s.name ? ` „${s.name}“` : ""}.`,
        { listingId: listing.id, slug: listing.slug, savedSearchId: s.id }
      );
      await db.query("UPDATE saved_searches SET last_notified_at = now() WHERE id = $1", [s.id]);
    }
  } catch (err) {
    console.error("saved search match failed:", err.message);
  }
}

module.exports = { notifySavedSearches, matches };
