const db = require("../db/pool");

async function notify(userId, type, title, body, data = {}) {
  if (!userId) return;
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, JSON.stringify(data)]
    );
  } catch (err) {
    console.error("notify failed:", err.message);
  }
}

module.exports = { notify };