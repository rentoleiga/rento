const db = require("../db/pool");
const { sendMail } = require("../services/mail");

function wrap(body) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#12332b;max-width:560px">
    <p>${String(body).replace(/\n/g, "<br/>")}</p>
    <p style="margin-top:24px;font-size:14px">Rentó · <a href="https://www.rento.is">rento.is</a></p>
  </div>`;
}

async function notify(userId, type, title, body, data = {}) {
  if (!userId) return;
  try {
    let deduped = false;
    if (type === "new_message" && data.conversationId) {
      const upd = await db.query(
        `UPDATE notifications
         SET title = $3, body = $4, created_at = now()
         WHERE user_id = $1 AND type = $2 AND read_at IS NULL
           AND data->>'conversationId' = $5`,
        [userId, type, title, body, String(data.conversationId)]
      );
      deduped = upd.rowCount > 0;
    } else if (data.bookingId) {
      const upd = await db.query(
        `UPDATE notifications
         SET title = $3, body = $4, created_at = now()
         WHERE user_id = $1 AND type = $2 AND read_at IS NULL
           AND data->>'bookingId' = $5`,
        [userId, type, title, body, String(data.bookingId)]
      );
      deduped = upd.rowCount > 0;
    }
    if (!deduped) {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, type, title, body, JSON.stringify(data)]
      );
    }
  } catch (err) {
    console.error("notify failed:", err.message);
  }
  try {
    const { rows } = await db.query(
      "SELECT email, language FROM users WHERE id = $1",
      [userId]
    );
    if (rows.length && rows[0].email) {
      await sendMail({
        to: rows[0].email,
        subject: `Rentó · ${title}`,
        text: `${body}\n\nRentó · https://www.rento.is`,
        html: wrap(body),
      });
    }
  } catch (err) {
    console.error("notify email failed:", err.message);
  }
}

module.exports = { notify };
