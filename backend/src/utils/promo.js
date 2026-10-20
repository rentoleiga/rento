const db = require("../db/pool");

// Validates a promo code for a purchase. Throws an Error with status 400 when
// the code is unknown, expired, exhausted or not valid for this purchase kind.
async function resolvePromo(rawCode, kind, amount) {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) return { code: "", discount: 0, finalAmount: amount, promo: null };
  const { rows } = await db.query(
    "SELECT * FROM promo_codes WHERE upper(code) = $1",
    [code]
  );
  if (!rows.length) throw Object.assign(new Error("Promókóðinn er ekki til"), { status: 400 });
  const p = rows[0];
  if (!p.active) throw Object.assign(new Error("Promókóðinn er ekki virkur"), { status: 400 });
  if (p.expires_at && new Date(p.expires_at) <= new Date()) {
    throw Object.assign(new Error("Promókóðinn er útrunninn"), { status: 400 });
  }
  if (p.max_uses != null && p.uses >= p.max_uses) {
    throw Object.assign(new Error("Promókóðanum hefur verið eytt upp"), { status: 400 });
  }
  if (p.kind !== "any" && p.kind !== kind) {
    throw Object.assign(new Error("Promókóðinn gildir ekki fyrir þetta kaup"), { status: 400 });
  }
  let discount = 0;
  if (p.percent > 0) discount = Math.round((amount * p.percent) / 100);
  else if (p.amount > 0) discount = p.amount;
  discount = Math.max(0, Math.min(amount, discount));
  return { code: p.code, discount, finalAmount: amount - discount, promo: p };
}

async function consumePromo(promo) {
  if (!promo) return;
  await db.query("UPDATE promo_codes SET uses = uses + 1 WHERE id = $1", [promo.id]);
}

module.exports = { resolvePromo, consumePromo };
