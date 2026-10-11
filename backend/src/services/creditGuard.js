const db = require("../db/pool");
const { logAdminAction } = require("../utils/adminLog");

// Largest credit package we sell - anything above it did not come from a package.
const MAX_PACKAGE_CREDITS = 12000;
// A user may not buy more than this many packages inside the window below.
const MAX_PURCHASES_PER_HOUR = 3;

const RULES = {
  balance_mismatch: { severity: "critical", label: "Kredit stanje se ne poklapa sa knjigom" },
  negative_balance: { severity: "critical", label: "Negativno kredit stanje" },
  orphan_balance: { severity: "warn", label: "Kredit bez izvora (bez kupovine)" },
  big_purchase: { severity: "critical", label: "Kupovina veća od najvećeg paketa" },
  burst_purchase: { severity: "warn", label: "Ponovljene kupovine u kratkom vremenu" },
  multi_account_ip: { severity: "warn", label: "Više naloga sa iste IP adrese" },
  boost_foreign: { severity: "critical", label: "Boost na tuđoj auglýsingu" },
};

// Insert alerts, skipping a rule that is already open for the same target.
async function insertAlerts(client, rows) {
  let created = 0;
  for (const a of rows) {
    const ins = await client.query(
      `INSERT INTO credit_alerts (rule, severity, user_id, listing_id, amount, ip, detail)
       SELECT $1::varchar, $2::varchar, $3::integer, $4::integer, $5::integer, $6::varchar, $7::jsonb
       WHERE NOT EXISTS (
         SELECT 1 FROM credit_alerts ca
         WHERE ca.rule = $1 AND ca.status = 'open'
           AND ca.user_id IS NOT DISTINCT FROM $3
           AND ca.listing_id IS NOT DISTINCT FROM $4
       )
       RETURNING id`,
      [
        a.rule,
        RULES[a.rule]?.severity || "warn",
        a.userId || null,
        a.listingId || null,
        a.amount === undefined ? null : a.amount,
        a.ip || null,
        a.detail ? JSON.stringify(a.detail) : null,
      ]
    );
    if (ins.rowCount === 1) {
      created += 1;
      logAdminAction({
        adminId: null,
        action: "credit.alert",
        targetType: "alert",
        targetId: ins.rows[0].id,
        data: { rule: a.rule, userId: a.userId || null, severity: RULES[a.rule]?.severity || "warn" },
        ip: a.ip || null,
      });
    }
  }
  return created;
}

// Full scan across every rule. Safe to run repeatedly - already open alerts
// are not duplicated.
async function scan() {
  const client = await db.pool.connect();
  let created = 0;
  try {
    await client.query("BEGIN");

    // 1. users.credit_balance must equal SUM(credit_transactions.amount)
    const mismatch = await client.query(`
      SELECT u.id AS user_id, u.credit_balance, COALESCE(SUM(c.amount), 0) AS ledger
      FROM users u
      LEFT JOIN credit_transactions c ON c.user_id = u.id
      GROUP BY u.id
      HAVING u.credit_balance <> COALESCE(SUM(c.amount), 0)`);
    created += await insertAlerts(
      client,
      mismatch.rows.map((r) => ({
        rule: "balance_mismatch",
        userId: r.user_id,
        amount: r.credit_balance,
        detail: { balance: r.credit_balance, ledger: Number(r.ledger) },
      }))
    );

    // 2. negative balance (should be impossible, but the ledger proves it)
    const neg = await client.query(
      `SELECT id AS user_id, credit_balance FROM users WHERE credit_balance < 0`
    );
    created += await insertAlerts(
      client,
      neg.rows.map((r) => ({
        rule: "negative_balance",
        userId: r.user_id,
        amount: r.credit_balance,
      }))
    );

    // 3. positive balance with no purchase row at all
    const orphan = await client.query(`
      SELECT u.id AS user_id, u.credit_balance
      FROM users u
      WHERE u.credit_balance > 0
        AND NOT EXISTS (SELECT 1 FROM credit_transactions c WHERE c.user_id = u.id AND c.type = 'purchase')`);
    created += await insertAlerts(
      client,
      orphan.rows.map((r) => ({
        rule: "orphan_balance",
        userId: r.user_id,
        amount: r.credit_balance,
      }))
    );

    // 4. purchases larger than the biggest package
    const big = await client.query(
      `SELECT id, user_id, amount, ip, created_at FROM credit_transactions
       WHERE type = 'purchase' AND amount > $1`,
      [MAX_PACKAGE_CREDITS]
    );
    created += await insertAlerts(
      client,
      big.rows.map((r) => ({
        rule: "big_purchase",
        userId: r.user_id,
        amount: r.amount,
        ip: r.ip,
        detail: { txId: r.id, createdAt: r.created_at, limit: MAX_PACKAGE_CREDITS },
      }))
    );

    // 5. more purchases than allowed inside one hour
    const burst = await client.query(
      `SELECT user_id, count(*)::int AS n, max(ip) AS ip
       FROM credit_transactions
       WHERE type = 'purchase' AND created_at > now() - interval '60 minutes'
       GROUP BY user_id HAVING count(*) > $1`,
      [MAX_PURCHASES_PER_HOUR]
    );
    created += await insertAlerts(
      client,
      burst.rows.map((r) => ({
        rule: "burst_purchase",
        userId: r.user_id,
        amount: r.n,
        ip: r.ip,
        detail: { purchasesLastHour: r.n, limit: MAX_PURCHASES_PER_HOUR },
      }))
    );

    // 6. several distinct accounts acting from one IP in the last 7 days
    const multiIp = await client.query(
      `SELECT ip, count(DISTINCT target_id)::int AS accounts, array_agg(DISTINCT target_id) AS user_ids
       FROM admin_actions
       WHERE action LIKE 'credit.%' AND ip IS NOT NULL AND target_id IS NOT NULL
         AND created_at > now() - interval '7 days'
       GROUP BY ip HAVING count(DISTINCT target_id) > 2`
    );
    created += await insertAlerts(
      client,
      multiIp.rows.map((r) => ({
        rule: "multi_account_ip",
        userId: null,
        ip: r.ip,
        amount: r.accounts,
        detail: { accounts: r.accounts, userIds: r.user_ids },
      }))
    );

    // 7. a boost charged to someone who does not own the listing
    const foreign = await client.query(
      `SELECT c.id, c.user_id, c.listing_id, c.amount, c.ip, l.owner_id
       FROM credit_transactions c
       JOIN listings l ON l.id = c.listing_id
       WHERE c.type = 'boost' AND l.owner_id <> c.user_id`
    );
    created += await insertAlerts(
      client,
      foreign.rows.map((r) => ({
        rule: "boost_foreign",
        userId: r.user_id,
        listingId: r.listing_id,
        amount: r.amount,
        ip: r.ip,
        detail: { txId: r.id, ownerId: r.owner_id },
      }))
    );

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  return { created, rules: Object.keys(RULES).length };
}

// Cheap per-user checks run right after a credit action (fire and forget).
async function quickChecks(userId, ip) {
  const client = await db.pool.connect();
  let created = 0;
  try {
    await client.query("BEGIN");
    const [big, burst] = await Promise.all([
      client.query(
        `SELECT id, amount, ip, created_at FROM credit_transactions
         WHERE user_id = $1 AND type = 'purchase' AND amount > $2
         ORDER BY created_at DESC LIMIT 5`,
        [userId, MAX_PACKAGE_CREDITS]
      ),
      client.query(
        `SELECT count(*)::int AS n FROM credit_transactions
         WHERE user_id = $1 AND type = 'purchase' AND created_at > now() - interval '60 minutes'`,
        [userId]
      ),
    ]);
    created += await insertAlerts(
      client,
      big.rows.map((r) => ({
        rule: "big_purchase",
        userId,
        amount: r.amount,
        ip: r.ip || ip,
        detail: { txId: r.id, createdAt: r.created_at, limit: MAX_PACKAGE_CREDITS },
      }))
    );
    if (burst.rows[0].n > MAX_PURCHASES_PER_HOUR) {
      created += await insertAlerts(client, [{
        rule: "burst_purchase",
        userId,
        amount: burst.rows[0].n,
        ip,
        detail: { purchasesLastHour: burst.rows[0].n, limit: MAX_PURCHASES_PER_HOUR },
      }]);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("credit quickChecks failed:", e.message);
  } finally {
    client.release();
  }
  return created;
}

// Rate limit inside the caller's transaction: too many purchases recently -> 429.
async function assertPurchaseAllowed(client, userId, ip) {
  const [byUser, byIp] = await Promise.all([
    client.query(
      `SELECT count(*)::int AS n FROM credit_transactions
       WHERE user_id = $1 AND type = 'purchase' AND created_at > now() - interval '60 minutes'`,
      [userId]
    ),
    ip
      ? client.query(
          `SELECT count(*)::int AS n FROM credit_transactions
           WHERE ip = $1 AND type = 'purchase' AND created_at > now() - interval '60 minutes'`,
          [ip]
        )
      : Promise.resolve({ rows: [{ n: 0 }] }),
  ]);
  if (byUser.rows[0].n >= MAX_PURCHASES_PER_HOUR) {
    const e = new Error("Purchase limit reached, try again later");
    e.status = 429;
    throw e;
  }
  if (byIp.rows[0].n >= MAX_PURCHASES_PER_HOUR * 3) {
    const e = new Error("Too many purchases from this network, try again later");
    e.status = 429;
    throw e;
  }
}

module.exports = {
  scan,
  quickChecks,
  assertPurchaseAllowed,
  MAX_PACKAGE_CREDITS,
  MAX_PURCHASES_PER_HOUR,
  RULES,
};
