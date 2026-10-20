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
    await db.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body, JSON.stringify(data)]
    );
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
