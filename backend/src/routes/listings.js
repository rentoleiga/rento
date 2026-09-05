const { Router } = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { z } = require("zod");
const db = require("../db/pool");
const config = require("../config");
const { authRequired, optionalAuth } = require("../middleware/auth");
const { asyncHandler, validate, err } = require("../middleware/http");
const { slugify, paginate, publicUser, publicListing } = require("../utils/helpers");

const router = Router();

// ---------------- image upload ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "..", config.uploadDir);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpe?g|png|webp|gif|heic|pdf/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(null, ok);
  },
});

router.post(
  "/upload",
  authRequired,
  upload.single("file"),
  (req, res) => {
    if (!req.file) throw err("No file uploaded", 400);
    res.json({
      url: `${config.publicBaseUrl}/uploads/${req.file.filename}`,
    });
  }
);

// ---------------- schemas ----------------
// Numeric fields accept incoming strings from clients and normalize to
// numbers (or null when empty), so validation never fails on type only.
const numOrNull = (type) =>
  z.preprocess(
    (v) => {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    },
    type.nullable()
  );

const numCoerce = (type) =>
  z.preprocess((v) => {
    if (v === null || v === undefined || v === "") return 0;
    const n = Number(v);
    return Number.isNaN(n) ? v : n;
  }, type);

const baseSchema = z.object({
  title: z.string().min(3).max(200),
  subtitle: z.string().max(300).optional().default(""),
  description: z.string().min(10).max(10000),
  categoryId: z.number().int().positive(),
  subcategoryId: z.number().int().positive(),
  currency: z.enum(["ISK", "EUR"]).default("ISK"),
  priceHourly: numOrNull(z.number().nonnegative()).optional(),
  priceDaily: numOrNull(z.number().nonnegative()).optional(),
  priceWeekly: numOrNull(z.number().nonnegative()).optional(),
  priceMonthly: numOrNull(z.number().nonnegative()).optional(),
  minimumDuration: z.coerce.number().min(0).max(365).default(1),
  minimumDurationUnit: z.enum(["hour", "day", "week"]).default("day"),
  depositAmount: numCoerce(z.number().nonnegative()).optional(),
  cleaningFee: numCoerce(z.number().nonnegative()).optional(),
  deliveryFee: numCoerce(z.number().nonnegative()).optional(),
  pickupFee: numCoerce(z.number().nonnegative()).optional(),
  extraFee: numCoerce(z.number().nonnegative()).optional(),
  country: z.string().default("Iceland"),
  region: z.string().optional().default(""),
  municipality: z.string().optional().default(""),
  city: z.string().min(1).max(120),
  postcode: z.string().optional().default(""),
  address: z.string().optional().default(""),
  latitude: numOrNull(z.number().min(-90).max(90)).optional(),
  longitude: numOrNull(z.number().min(-180).max(180)).optional(),
  airportName: z.string().optional().default(""),
  airportDistance: numCoerce(z.number().nonnegative()).optional(),
  locationPublic: z.boolean().default(true),
  pickupAvailable: z.boolean().default(true),
  deliveryAvailable: z.boolean().default(false),
  instantBooking: z.boolean().default(false),
  bookingRequired: z.boolean().default(true),
  smokingAllowed: z.boolean().default(false),
  petsAllowed: z.boolean().default(false),
  minAge: z.coerce.number().int().min(0).default(0),
  usageRestrictions: z.string().optional().default(""),
  cancellationPolicy: z.enum(["flexible", "moderate", "strict", "custom"]).default("moderate"),
  condition: z.enum(["new", "like_new", "good", "fair", "used"]).default("good"),
  conditionDescription: z.string().optional().default(""),
  phoneVisibility: z.boolean().default(false),
  attributes: z.record(z.any()).optional().default({}),
  mainImage: z.string().optional().default(""),
  gallery: z.array(z.string()).optional().default([]),
  instantPublish: z.boolean().optional().default(true),
  publish: z.boolean().optional().default(false),
});

function listingColumnsForInsert() {
  return [
    ["slug", "owner_id", "title", "subtitle", "description"],
    ["category_id", "subcategory_id", "main_image", "gallery", "status", "verification_status"],
    ["featured", "currency"],
    ["price_hourly", "price_daily", "price_weekly", "price_monthly"],
    ["minimum_duration", "minimum_duration_unit", "deposit_amount"],
    ["cleaning_fee", "delivery_fee", "pickup_fee", "extra_fee"],
    ["country", "region", "municipality", "city", "postcode", "address"],
    ["latitude", "longitude", "airport_name", "airport_distance", "location_public"],
    ["pickup_available", "delivery_available", "instant_booking", "booking_required"],
    ["smoking_allowed", "pets_allowed", "min_age", "usage_restrictions", "cancellation_policy"],
    ["condition", "condition_description", "phone_visibility", "attributes"],
    ["seo_title", "seo_description", "view_count", "unique_view_count"],
  ].flat();
}

function buildListingValues(l, ownerId, slug) {
  const gallery = (l.gallery && l.gallery.length ? l.gallery : []).filter(Boolean);
  return [
    slug, ownerId, l.title, l.subtitle, l.description,
    l.categoryId, l.subcategoryId, l.mainImage || gallery[0] || "", JSON.stringify(gallery),
    l.publish ? "published" : "draft", l.instantPublish ? "approved" : "pending",
    false, l.currency,
    l.priceHourly ?? null, l.priceDaily ?? null, l.priceWeekly ?? null, l.priceMonthly ?? null,
    l.minimumDuration, l.minimumDurationUnit, l.depositAmount,
    l.cleaningFee, l.deliveryFee, l.pickupFee, l.extraFee,
    l.country, l.region, l.municipality, l.city, l.postcode, l.address,
    l.latitude ?? null, l.longitude ?? null, l.airportName, l.airportDistance, l.locationPublic,
    l.pickupAvailable, l.deliveryAvailable, l.instantBooking, l.bookingRequired,
    l.smokingAllowed, l.petsAllowed, l.minAge, l.usageRestrictions, l.cancellationPolicy,
    l.condition, l.conditionDescription, l.phoneVisibility, JSON.stringify(l.attributes || {}),
    l.title, l.subtitle, 0, 0,
  ];
}

const LISTING_COLS = listingColumnsForInsert();

async function getListingOr404(req, res) {
  const { rows } = await db.query(
    `SELECT l.*, c.slug AS category_slug, COALESCE(ct.name,'') AS category_name,
            sub.slug AS subcategory_slug, COALESCE(st.name,'') AS subcategory_name,
            u.first_name AS owner_first_name, u.last_name AS owner_last_name,
            u.avatar AS owner_avatar, u.bio AS owner_bio, u.city AS owner_city,
            u.rating AS owner_rating, u.review_count AS owner_review_count,
            u.response_rate AS owner_response_rate, u.response_time AS owner_response_time,
            u.created_at AS owner_created_at,
            u.identity_verified AS owner_identity_verified,
            u.business_verified AS owner_business_verified,
            u.listing_verified AS owner_listing_verified,
            u.phone AS owner_phone,
            u.email AS owner_email
     FROM listings l
     LEFT JOIN categories c ON c.id = l.category_id
     LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language = 'en'
     LEFT JOIN categories sub ON sub.id = l.subcategory_id
     LEFT JOIN category_translations st ON st.category_id = sub.id AND st.language = 'en'
     LEFT JOIN users u ON u.id = l.owner_id
     WHERE CAST(l.id AS text) = $1 OR l.slug = $1
     LIMIT 1`,
    [req.params.id]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

router.post(
  "/",
  authRequired,
  validate(baseSchema),
  asyncHandler(async (req, res) => {
    if (!req.user.owner_enabled) {
      throw err("Your account does not have owner access enabled.", 403);
    }
    const existing = await db.query("SELECT id FROM listings WHERE slug = $1", [
      slugify(req.body.title),
    ]);
    const slug = existing.rowCount > 0
      ? `${slugify(req.body.title)}-${Date.now().toString(36).slice(-6)}`
      : slugify(req.body.title);
    const values = buildListingValues(req.body, req.user.id, slug);
    const placeholders = LISTING_COLS.map((_, i) => `$${i + 1}`).join(",");
    const { rows } = await db.query(
      `INSERT INTO listings (${LISTING_COLS.join(",")}) VALUES (${placeholders}) RETURNING id`,
      values
    );
    const id = rows[0].id;

    if (Array.isArray(req.body.gallery)) {
      for (let i = 0; i < req.body.gallery.length; i++) {
        await db.query(
          `INSERT INTO listing_images (listing_id, url, sort_order) VALUES ($1,$2,$3)`,
          [id, req.body.gallery[i], i]
        );
      }
    }
    const listing = await getListingOr404({ params: { id } }, res);
    res.status(201).json({ listing: publicListing(listing, { detail: true }) });
  })
);

router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const listing = await getListingOr404(req, res);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    if (req.user) {
      const fav = await db.query(
        "SELECT 1 FROM favorites WHERE user_id=$1 AND listing_id=$2",
        [req.user.id, listing.id]
      );
      listing.is_favorite = fav.rowCount > 0;
    }

    const { rows: galleryRows } = await db.query(
      "SELECT url FROM listing_images WHERE listing_id=$1 ORDER BY sort_order",
      [listing.id]
    );
    listing.gallery = galleryRows.map((r) => r.url);

    // Increment view counter once per session/user
    if (req.query.inc === "1") {
      await db.query(
        `UPDATE listings SET view_count = view_count + 1 WHERE id = $1`,
        [listing.id]
      );
    }

    const out = publicListing(listing, { detail: true });
    out.isFavorite = listing.is_favorite === true;

    // Owner contact details only revealed after a confirmed booking
    const canContact =
      req.user &&
      (req.user.role === "admin" || req.user.id === listing.owner_id ||
        (await db.query(
          `SELECT 1 FROM bookings
           WHERE listing_id=$1 AND renter_id=$2 AND status IN ('active','returned','completed')
           LIMIT 1`,
          [listing.id, req.user.id]
        )).rowCount > 0);

    out.ownerPhone =
      listing.phone_visibility ? listing.owner_phone : null;
    out.ownerEmail = canContact ? listing.owner_email : null;

    res.json({ listing: out });
  })
);

router.put(
  "/:id",
  authRequired,
  validate(baseSchema.partial()),
  asyncHandler(async (req, res) => {
    const listing = await getListingOr404(req, res);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (req.user.role !== "admin" && req.user.id !== listing.owner_id) {
      throw err("You can only edit your own listings", 403);
    }
    const cols = [];
    const vals = [];
    let i = 1;
    const map = {
      title: "title", subtitle: "subtitle", description: "description",
      categoryId: "category_id", subcategoryId: "subcategory_id",
      mainImage: "main_image", gallery: "gallery",
      currency: "currency", priceHourly: "price_hourly", priceDaily: "price_daily",
      priceWeekly: "price_weekly", priceMonthly: "price_monthly",
      minimumDuration: "minimum_duration", minimumDurationUnit: "minimum_duration_unit",
      depositAmount: "deposit_amount", cleaningFee: "cleaning_fee",
      deliveryFee: "delivery_fee", pickupFee: "pickup_fee", extraFee: "extra_fee",
      city: "city", region: "region", municipality: "municipality",
      postcode: "postcode", address: "address", latitude: "latitude",
      longitude: "longitude", airportName: "airport_name",
      airportDistance: "airport_distance", locationPublic: "location_public",
      pickupAvailable: "pickup_available", deliveryAvailable: "delivery_available",
      instantBooking: "instant_booking", bookingRequired: "booking_required",
      smokingAllowed: "smoking_allowed", petsAllowed: "pets_allowed",
      minAge: "min_age", usageRestrictions: "usage_restrictions",
      cancellationPolicy: "cancellation_policy", condition: "condition",
      conditionDescription: "condition_description", phoneVisibility: "phone_visibility",
      attributes: "attributes",
    };
    for (const [key, value] of Object.entries(req.body)) {
      if (!(key in map)) continue;
      if (key === "gallery" || key === "attributes") {
        cols.push(`${map[key]} = $${i++}`);
        vals.push(JSON.stringify(value));
      } else {
        cols.push(`${map[key]} = $${i++}`);
        vals.push(value);
      }
    }
    if (req.body.publish === true) {
      cols.push("status='published', verification_status = 'approved'");
    }
    cols.push("updated_at = now()");
    await db.query(
      `UPDATE listings SET ${cols.join(", ")} WHERE id = $${vals.length + 1}`,
      [...vals, req.params.id]
    );
    if (req.body.gallery) {
      await db.query(`DELETE FROM listing_images WHERE listing_id = $1`, [listing.id]);
      const gallery = req.body.gallery.filter(Boolean);
      for (let i = 0; i < gallery.length; i++) {
        await db.query(
          `INSERT INTO listing_images (listing_id, url, sort_order) VALUES ($1,$2,$3)`,
          [listing.id, gallery[i], i]
        );
      }
    }
    const updated = await getListingOr404(req, res);
    res.json({ listing: publicListing(updated, { detail: true }) });
  })
);

router.delete(
  "/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const listing = await getListingOr404(req, res);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (req.user.role !== "admin" && req.user.id !== listing.owner_id) {
      throw err("You can only delete your own listings", 403);
    }
    await db.query(`UPDATE listings SET status='deleted' WHERE id = $1`, [listing.id]);
    res.json({ ok: true });
  })
);

// ---------------- promotion tiers ----------------
const PROMO_TIERS = { silver: "featured", gold: "gold", platinum: "platinum" };

router.post(
  "/:id/promote",
  authRequired,
  asyncHandler(async (req, res) => {
    const listing = await getListingOr404(req, res);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (req.user.role !== "admin" && req.user.id !== listing.owner_id) {
      throw err("You can only promote your own listings", 403);
    }
    const tierIn = String(req.body.tier || "").toLowerCase();
    const dbTier = PROMO_TIERS[tierIn];
    if (!dbTier) throw err("Tier must be silver, gold or platinum", 400);
    const days = Math.max(1, parseInt(req.body.days, 10) || 7);
    await db.query(
      `UPDATE listings
         SET promotion_tier = $1,
             promotion_until = now() + make_interval(days => $2),
             updated_at = now()
       WHERE id = $3`,
      [dbTier, days, listing.id]
    );
    const updated = await getListingOr404(req, res);
    res.json({ listing: publicListing(updated, { detail: true }) });
  })
);

router.delete(
  "/:id/promote",
  authRequired,
  asyncHandler(async (req, res) => {
    const listing = await getListingOr404(req, res);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (req.user.role !== "admin" && req.user.id !== listing.owner_id) {
      throw err("You can only promote your own listings", 403);
    }
    await db.query(
      `UPDATE listings SET promotion_tier = 'none', promotion_until = NULL, updated_at = now() WHERE id = $1`,
      [listing.id]
    );
    const updated = await getListingOr404(req, res);
    res.json({ listing: publicListing(updated, { detail: true }) });
  })
);

// ---------------- favorites ----------------
router.post(
  "/:id/favorite",
  authRequired,
  asyncHandler(async (req, res) => {
    const listing = await getListingOr404(req, res);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    await db.query(
      `INSERT INTO favorites (user_id, listing_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.id, listing.id]
    );
    await db.query(`UPDATE listings SET favorite_count = favorite_count + 1 WHERE id = $1`, [listing.id]);
    res.json({ isFavorite: true });
  })
);

router.delete(
  "/:id/favorite",
  authRequired,
  asyncHandler(async (req, res) => {
    const listing = await getListingOr404(req, res);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    await db.query(
      `DELETE FROM favorites WHERE user_id=$1 AND listing_id=$2`,
      [req.user.id, listing.id]
    );
    const cnt = await db.query(`SELECT count(*)::int AS n FROM favorites WHERE listing_id=$1`, [listing.id]);
    await db.query(`UPDATE listings SET favorite_count=$2 WHERE id=$1`, [
      listing.id, cnt.rows[0].n,
    ]);
    res.json({ isFavorite: false });
  })
);

module.exports = router;
module.exports.getListingOr404 = getListingOr404;