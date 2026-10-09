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
    `);
    console.log("Incremental migrations applied.");
  } catch (err) {
    console.error("Incremental migration error:", err.message);
  }
}

module.exports = { migrate };
