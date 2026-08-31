const fs = require("fs");
const path = require("path");
const { pool } = require("./pool");

async function init() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(schema);
    await client.query("COMMIT");
    console.log("Database schema ready.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Schema init failed:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

init();