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
      return;
    }

    console.log("Running database migration...");
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await db.query(schema);
    console.log("Schema created.");

    console.log("Seeding demo data...");
    const { seed } = require("./seed");
    await seed();
    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration error:", err.message);
  }
}

module.exports = { migrate };
