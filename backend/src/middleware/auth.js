const jwt = require("jsonwebtoken");
const config = require("../config");
const db = require("../db/pool");

function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpires,
  });
}

async function loadUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const { rows } = await db.query(
      `SELECT id, email, first_name, last_name, avatar, bio, city, phone,
              language, currency_pref, role,
              renter_enabled, owner_enabled, business_account,
              email_verified, phone_verified, identity_verified,
              business_verified, listing_verified,
              rating, review_count, completed_rentals,
              response_rate, response_time, created_at
       FROM users WHERE id = $1`,
      [payload.sub]
    );
    return rows[0] || null;
  } catch {
    return null;
  }
}

async function authRequired(req, res, next) {
  try {
    const user = await loadUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

async function optionalAuth(req, res, next) {
  try {
    req.user = await loadUser(req);
    next();
  } catch (err) {
    next(err);
  }
}

function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

module.exports = { signToken, authRequired, optionalAuth, adminRequired, loadUser };