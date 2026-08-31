-- ============================================================
-- Iceland Rental Marketplace - PostgreSQL schema
-- MVP Phase 1+2: users, categories, listings, availability,
-- bookings, messaging, favorites, reviews, notifications
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- USERS (spec section 3 role system)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                 SERIAL PRIMARY KEY,
  email              VARCHAR(255) NOT NULL UNIQUE,
  password_hash      VARCHAR(255) NOT NULL,
  phone              VARCHAR(32),
  first_name         VARCHAR(100) NOT NULL DEFAULT '',
  last_name          VARCHAR(100) NOT NULL DEFAULT '',
  avatar             TEXT,
  bio                TEXT,
  city               VARCHAR(120) DEFAULT '',
  language           VARCHAR(5)   NOT NULL DEFAULT 'en',   -- en | is
  currency_pref      VARCHAR(3)   NOT NULL DEFAULT 'ISK',  -- ISK | EUR

  role               VARCHAR(20)  NOT NULL DEFAULT 'user', -- user | admin

  renter_enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
  owner_enabled      BOOLEAN      NOT NULL DEFAULT TRUE,
  business_account   BOOLEAN      NOT NULL DEFAULT FALSE,

  email_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
  phone_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
  identity_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
  business_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
  listing_verified   BOOLEAN      NOT NULL DEFAULT FALSE,

  rating             NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count       INTEGER      NOT NULL DEFAULT 0,
  completed_rentals  INTEGER      NOT NULL DEFAULT 0,
  response_rate      NUMERIC(5,2) NOT NULL DEFAULT 0,   -- percent
  response_time      INTEGER      NOT NULL DEFAULT 0,   -- minutes

  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);

-- ------------------------------------------------------------
-- CATEGORIES / SUBCATEGORIES (rental_category taxonomy)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  parent_id  INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  slug       VARCHAR(120) NOT NULL UNIQUE,
  icon       VARCHAR(60)  DEFAULT '',
  cover_img  TEXT,
  sort_order INTEGER      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS category_translations (
  id          SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  language    VARCHAR(5) NOT NULL DEFAULT 'en',
  name        VARCHAR(160) NOT NULL,
  UNIQUE (category_id, language)
);

-- ------------------------------------------------------------
-- LOCATIONS (rental_location taxonomy object, spec section 9)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locations (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(120) NOT NULL UNIQUE,
  country         VARCHAR(60)  NOT NULL DEFAULT 'Iceland',
  region          VARCHAR(80)  DEFAULT '',
  municipality    VARCHAR(80)  DEFAULT '',
  city            VARCHAR(120) NOT NULL,
  postcode        VARCHAR(20)  DEFAULT '',
  latitude        NUMERIC(10,6),
  longitude       NUMERIC(10,6),
  airport_name    VARCHAR(120) DEFAULT '',
  airport_distance NUMERIC(8,2) DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_locations_city ON locations (lower(city));

-- ------------------------------------------------------------
-- LISTINGS (rental_listing CPT, spec sections 6-8)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listings (
  id                    SERIAL PRIMARY KEY,
  slug                  VARCHAR(180) NOT NULL UNIQUE,
  owner_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title                 VARCHAR(200) NOT NULL,
  subtitle              VARCHAR(300) DEFAULT '',
  description           TEXT DEFAULT '',

  category_id           INTEGER REFERENCES categories(id),
  subcategory_id        INTEGER REFERENCES categories(id),

  main_image            TEXT DEFAULT '',
  gallery               JSONB        NOT NULL DEFAULT '[]',

  status                VARCHAR(20)  NOT NULL DEFAULT 'draft',
  -- draft | pending_review | published | paused | rejected | suspended | expired | deleted
  verification_status   VARCHAR(20)  NOT NULL DEFAULT 'pending',
  featured              BOOLEAN      NOT NULL DEFAULT FALSE,
  featured_until        TIMESTAMPTZ,
  promotion_tier        VARCHAR(20)  NOT NULL DEFAULT 'none', -- none | featured | gold | platinum
  promotion_until       TIMESTAMPTZ,

  -- Pricing (spec section 17)
  currency              VARCHAR(3)   NOT NULL DEFAULT 'ISK',
  price_hourly          NUMERIC(12,2),
  price_daily           NUMERIC(12,2),
  price_weekly          NUMERIC(12,2),
  price_monthly         NUMERIC(12,2),
  minimum_duration      NUMERIC(5,1) NOT NULL DEFAULT 1,
  minimum_duration_unit VARCHAR(10)  NOT NULL DEFAULT 'day', -- hour | day | week
  deposit_amount        NUMERIC(12,2) DEFAULT 0,

  cleaning_fee          NUMERIC(12,2) DEFAULT 0,
  delivery_fee          NUMERIC(12,2) DEFAULT 0,
  pickup_fee            NUMERIC(12,2) DEFAULT 0,
  extra_fee             NUMERIC(12,2) DEFAULT 0,

  -- Location
  country               VARCHAR(60)  NOT NULL DEFAULT 'Iceland',
  region                VARCHAR(80)  DEFAULT '',
  municipality          VARCHAR(80)  DEFAULT '',
  city                  VARCHAR(120) DEFAULT '',
  postcode              VARCHAR(20)  DEFAULT '',
  address               TEXT         DEFAULT '',
  latitude              NUMERIC(10,6),
  longitude             NUMERIC(10,6),
  airport_name          VARCHAR(120) DEFAULT '',
  airport_distance      NUMERIC(8,2) DEFAULT 0,
  location_public       BOOLEAN      NOT NULL DEFAULT TRUE, -- hide exact address until booking

  -- Rental options
  pickup_available      BOOLEAN      NOT NULL DEFAULT TRUE,
  delivery_available    BOOLEAN      NOT NULL DEFAULT FALSE,
  instant_booking       BOOLEAN      NOT NULL DEFAULT FALSE,
  booking_required      BOOLEAN      NOT NULL DEFAULT TRUE,

  -- Rules
  smoking_allowed       BOOLEAN      NOT NULL DEFAULT FALSE,
  pets_allowed          BOOLEAN      NOT NULL DEFAULT FALSE,
  min_age               INTEGER      DEFAULT 0,
  usage_restrictions    TEXT         DEFAULT '',
  cancellation_policy   VARCHAR(20)  NOT NULL DEFAULT 'moderate',
  -- flexible | moderate | strict | custom

  -- Condition
  condition             VARCHAR(20)  DEFAULT 'good', -- new | like_new | good | fair | used
  condition_description TEXT         DEFAULT '',

  -- Contact
  phone_visibility      BOOLEAN      NOT NULL DEFAULT FALSE,

  -- Category-specific attributes (spec section 8) as flexible JSONB
  attributes            JSONB        NOT NULL DEFAULT '{}',

  -- SEO
  seo_title             VARCHAR(200) DEFAULT '',
  seo_description       TEXT         DEFAULT '',

  -- Analytics
  view_count            INTEGER      NOT NULL DEFAULT 0,
  unique_view_count     INTEGER      NOT NULL DEFAULT 0,
  favorite_count        INTEGER      NOT NULL DEFAULT 0,
  rating                NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count          INTEGER      NOT NULL DEFAULT 0,

  created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_owner     ON listings (owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_category  ON listings (category_id);
CREATE INDEX IF NOT EXISTS idx_listings_subcategory ON listings (subcategory_id);
CREATE INDEX IF NOT EXISTS idx_listings_status    ON listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_city      ON listings (lower(city));
CREATE INDEX IF NOT EXISTS idx_listings_geo       ON listings (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_listings_price     ON listings (price_daily);
CREATE INDEX IF NOT EXISTS idx_listings_featured  ON listings (featured) WHERE featured = TRUE;

-- Migration guards for columns added after initial table creation
ALTER TABLE listings ADD COLUMN IF NOT EXISTS promotion_tier      VARCHAR(20)  NOT NULL DEFAULT 'none';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS promotion_until     TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_listings_promotion ON listings (promotion_tier, promotion_until);

-- ------------------------------------------------------------
-- LISTING IMAGES (explicit gallery table as well as jsonb)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_images (
  id         SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- FAVORITES (spec section 30)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites (user_id);

-- ------------------------------------------------------------
-- AVAILABILITY (spec section 14)
-- status: available | blocked | booked | maintenance
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS availability (
  id           SERIAL PRIMARY KEY,
  listing_id   INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'available',
  booking_id   INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT availability_time_check CHECK (end_time > start_time),
  CONSTRAINT availability_status_check CHECK (status IN
    ('available','blocked','booked','maintenance'))
);

CREATE INDEX IF NOT EXISTS idx_availability_listing ON availability (listing_id);
CREATE INDEX IF NOT EXISTS idx_availability_period ON availability (listing_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_availability_status  ON availability (status);

-- ------------------------------------------------------------
-- BOOKINGS (spec sections 15-16)
-- status flow: pending -> approved -> payment_pending -> paid(active) -> returned -> completed
--              pending -> rejected | cancelled
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id                  SERIAL PRIMARY KEY,
  listing_id          INTEGER NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  renter_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  owner_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  start_time          TIMESTAMPTZ NOT NULL,
  end_time            TIMESTAMPTZ NOT NULL,

  duration            NUMERIC(8,1) NOT NULL DEFAULT 1,
  duration_unit       VARCHAR(10)  NOT NULL DEFAULT 'day',

  base_price          NUMERIC(12,2) NOT NULL DEFAULT 0,
  extra_fees          NUMERIC(12,2) NOT NULL DEFAULT 0,
  cleaning_fee        NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_fee        NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposit             NUMERIC(12,2) NOT NULL DEFAULT 0,
  total               NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency            VARCHAR(3)    NOT NULL DEFAULT 'ISK',

  status              VARCHAR(20)    NOT NULL DEFAULT 'pending',
  -- pending | approved | rejected | cancelled | payment_pending | active | returned | completed
  payment_status      VARCHAR(20)    NOT NULL DEFAULT 'unpaid',
  -- unpaid | authorized | paid | failed | refunded | partially_refunded
  pickup_status       VARCHAR(20)    NOT NULL DEFAULT 'pending',
  -- pending | picked_up | returned
  return_status       VARCHAR(20)    NOT NULL DEFAULT 'pending',
  -- pending | returned | inspected
  cancellation_reason TEXT DEFAULT '',

  message             TEXT DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT booking_time_check CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_bookings_listing  ON bookings (listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter   ON bookings (renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner    ON bookings (owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_period   ON bookings (listing_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status   ON bookings (status);

-- ------------------------------------------------------------
-- TRANSACTIONS (spec section 19)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id                 SERIAL PRIMARY KEY,
  booking_id         INTEGER NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  payer_id           INTEGER NOT NULL REFERENCES users(id),
  receiver_id        INTEGER NOT NULL REFERENCES users(id),
  amount             NUMERIC(12,2) NOT NULL,
  platform_fee       NUMERIC(12,2) NOT NULL DEFAULT 0,
  owner_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency           VARCHAR(3)    NOT NULL DEFAULT 'ISK',
  status             VARCHAR(20)   NOT NULL DEFAULT 'pending',
  -- pending | authorized | paid | failed | refunded | partially_refunded
  provider_reference VARCHAR(120) DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_booking ON transactions (booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payer  ON transactions (payer_id);

-- ------------------------------------------------------------
-- CONVERSATIONS / MESSAGES (spec section 21)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id              SERIAL PRIMARY KEY,
  listing_id      INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  booking_id      INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  renter_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_renter ON conversations (renter_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner  ON conversations (owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON conversations (listing_id);

CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message         TEXT NOT NULL DEFAULT '',
  attachment      TEXT DEFAULT '',
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON messages (receiver_id, read_at);

-- ------------------------------------------------------------
-- REVIEWS (spec section 22) - only completed bookings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id                    SERIAL PRIMARY KEY,
  booking_id            INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  listing_id            INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reviewer_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating                INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  communication_rating  INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  accuracy_rating       INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5),
  cleanliness_rating    INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
  pickup_rating         INTEGER CHECK (pickup_rating BETWEEN 1 AND 5),
  comment               TEXT DEFAULT '',
  status                VARCHAR(20) NOT NULL DEFAULT 'published',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews (listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews (reviewed_user_id);
-- Migration for existing DBs with UNIQUE(booking_id) only: drop and replace
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_booking_id_key') THEN
    ALTER TABLE reviews DROP CONSTRAINT reviews_booking_id_key;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_booking_reviewer_unique') THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_booking_reviewer_unique UNIQUE (booking_id, reviewer_id);
  END IF;
END $$;

-- ------------------------------------------------------------
-- NOTIFICATIONS (spec section 32)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(40) NOT NULL,
  title      VARCHAR(200) NOT NULL,
  body       TEXT DEFAULT '',
  data       JSONB DEFAULT '{}',
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, read_at, created_at);

-- ------------------------------------------------------------
-- SEARCH FACET CACHE helper views
-- ------------------------------------------------------------
DROP VIEW IF EXISTS v_listing_search;
CREATE OR REPLACE VIEW v_listing_search AS
SELECT
  l.*,
  c.slug AS category_slug,
  COALESCE(ct.name, '') AS category_name,
  sub.slug AS subcategory_slug,
  COALESCE(st.name, '') AS subcategory_name,
  u.first_name AS owner_first_name,
  u.last_name  AS owner_last_name,
  u.avatar     AS owner_avatar,
  u.rating     AS owner_rating,
  u.identity_verified AS owner_identity_verified,
  (0.5 * COALESCE(l.rating,0) + 0.5) * LEAST(1, 1 + l.review_count) AS sort_recommended
FROM listings l
LEFT JOIN categories c ON c.id = l.category_id
LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language = 'en'
LEFT JOIN categories sub ON sub.id = l.subcategory_id
LEFT JOIN category_translations st ON st.category_id = sub.id AND st.language = 'en'
LEFT JOIN users u ON u.id = l.owner_id
WHERE l.status = 'published' AND l.verification_status IN ('approved','verified')
GROUP BY l.id, c.slug, ct.name, sub.slug, st.name, u.first_name, u.last_name, u.avatar, u.rating, u.identity_verified;