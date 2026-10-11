const fs = require("fs");
const path = require("path");
const db = require("./pool");

async function migrate() {
  try {
    const { rows } = await db.query(
      "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'"
    );
    if (rows[0].n > 0) {
      console.log("Database tables already exist, skipping migration.");
    } else {
      console.log("Running database migration...");
      const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
      await db.query(schema);
      console.log("Schema created.");

      console.log("Seeding demo data...");
      const { seed } = require("./seed");
      await seed();
      console.log("Migration complete.");
    }

    await applyMigrations();
  } catch (err) {
    console.error("Migration error:", err.message);
  }
}

async function applyMigrations() {
  try {
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_balance INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS extra_slots INTEGER NOT NULL DEFAULT 0;

      CREATE TABLE IF NOT EXISTS credit_transactions (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type        VARCHAR(20) NOT NULL,          -- purchase | slot | boost
        amount      INTEGER NOT NULL,              -- credits delta (negative = spent)
        description VARCHAR(200) NOT NULL DEFAULT '',
        listing_id  INTEGER REFERENCES listings(id) ON DELETE SET NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions (user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS app_migrations (
        id         VARCHAR(100) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS admin_actions (
        id          SERIAL PRIMARY KEY,
        admin_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- NULL = automatic/user-side event
        action      VARCHAR(60) NOT NULL,
        target_type VARCHAR(30),
        target_id   INTEGER,
        data        JSONB,
        ip          VARCHAR(60),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_admin_actions_admin   ON admin_actions (admin_id);
      CREATE INDEX IF NOT EXISTS idx_admin_actions_action  ON admin_actions (action);

      ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at     TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_reason VARCHAR(255) NOT NULL DEFAULT '';

      CREATE TABLE IF NOT EXISTS contact_messages (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(120)  NOT NULL DEFAULT '',
        email       VARCHAR(255)  NOT NULL,
        subject     VARCHAR(200)  NOT NULL DEFAULT '',
        message     TEXT          NOT NULL,
        status      VARCHAR(20)   NOT NULL DEFAULT 'new',
        ip          VARCHAR(60),
        created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        answered_at TIMESTAMPTZ,
        answered_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages (status, created_at DESC);

      ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS ip VARCHAR(60);

      CREATE TABLE IF NOT EXISTS credit_payments (
        id                SERIAL PRIMARY KEY,
        user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        package_id        VARCHAR(30) NOT NULL,
        credits           INTEGER NOT NULL,
        amount            INTEGER NOT NULL,                 -- price in ISK
        currency          VARCHAR(3)   NOT NULL DEFAULT 'ISK',
        status            VARCHAR(20)  NOT NULL DEFAULT 'paid',  -- pending | paid | failed
        provider_reference VARCHAR(120),
        created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_credit_payments_user ON credit_payments (user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS credit_alerts (
        id          SERIAL PRIMARY KEY,
        rule        VARCHAR(40) NOT NULL,
        severity    VARCHAR(10) NOT NULL DEFAULT 'warn',   -- info | warn | critical
        user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
        listing_id  INTEGER REFERENCES listings(id) ON DELETE SET NULL,
        amount      INTEGER,
        ip          VARCHAR(60),
        detail      JSONB,
        status      VARCHAR(20) NOT NULL DEFAULT 'open',   -- open | reviewed | dismissed
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        reviewed_at TIMESTAMPTZ,
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_credit_alerts_status ON credit_alerts (status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_credit_alerts_rule   ON credit_alerts (rule);
    `);
    console.log("Incremental migrations applied.");

    // One-time refresh of demo promotions so the boost rules are visible.
    const ins = await db.query(
      "INSERT INTO app_migrations (id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id",
      ["refresh_demo_promotions_1"]
    );
    if (ins.rowCount === 1) {
      await db.query(`
        UPDATE listings SET promotion_until = now() + interval '30 days'
          WHERE promotion_tier = 'platinum' AND (promotion_until IS NULL OR promotion_until <= now());
        UPDATE listings SET promotion_until = now() + interval '14 days'
          WHERE promotion_tier = 'gold' AND (promotion_until IS NULL OR promotion_until <= now());
        UPDATE listings SET promotion_until = now() + interval '7 days'
          WHERE promotion_tier IN ('silver','featured') AND (promotion_until IS NULL OR promotion_until <= now());
      `);
      console.log("Refreshed demo promotions.");
    }
  } catch (err) {
    console.error("Incremental migration error:", err.message);
  }
}

module.exports = { migrate };
