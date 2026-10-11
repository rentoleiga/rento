const db = require("../db/pool");

// Append one row to the admin audit trail.
// Never throws into the caller's path - a failed audit write must not
// roll back or break the business operation it describes.
async function logAdminAction({ adminId, action, targetType, targetId, data, ip }) {
  try {
    await db.query(
      `INSERT INTO admin_actions (admin_id, action, target_type, target_id, data, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        adminId || null,
        action,
        targetType || null,
        targetId || null,
        data === undefined || data === null ? null : JSON.stringify(data),
        ip || null,
      ]
    );
  } catch (e) {
    console.error("admin log failed:", e.message);
  }
}

module.exports = { logAdminAction };
