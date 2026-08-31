const { Router } = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { z } = require("zod");
const db = require("../db/pool");
const config = require("../config");
const { signToken, authRequired, optionalAuth } = require("../middleware/auth");
const { asyncHandler, validate, err } = require("../middleware/http");
const { publicUser, slugify } = require("../utils/helpers");

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().trim().max(100).default(""),
  lastName: z.string().trim().max(100).default(""),
  phone: z.string().trim().max(32).optional().default(""),
  city: z.string().trim().max(120).default(""),
  language: z.enum(["en", "is"]).default("en"),
  currencyPref: z.enum(["ISK", "EUR"]).default("ISK"),
  renterEnabled: z.boolean().default(true),
  ownerEnabled: z.boolean().default(true),
});

const profileSchema = z.object({
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(32).optional(),
  bio: z.string().trim().max(2000).optional(),
  city: z.string().trim().max(120).optional(),
  language: z.enum(["en", "is"]).optional(),
  currencyPref: z.enum(["ISK", "EUR"]).optional(),
  avatar: z.string().url().optional(),
});

const verifySchema = z.object({
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  identityVerified: z.boolean().optional(),
  businessVerified: z.boolean().optional(),
});

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, ...rest } = req.body;
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount > 0) {
      throw err("An account with this email already exists", 409);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO users
        (email, password_hash, first_name, last_name, phone, city,
         language, currency_pref, renter_enabled, owner_enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, email, language, currency_pref, role`,
      [
        email.toLowerCase(),
        passwordHash,
        rest.firstName,
        rest.lastName,
        rest.phone || "",
        rest.city,
        rest.language,
        rest.currencyPref,
        rest.renterEnabled,
        rest.ownerEnabled,
      ]
    );
    const user = rows[0];
    const token = signToken(user.id);
    const { rows: fullRows } = await db.query(
      `SELECT * FROM users WHERE id = $1`,
      [user.id]
    );
    res.status(201).json({ token, user: publicUser(fullRows[0]) });
  })
);

router.post(
  "/login",
  validate(z.object({ email: z.string().email(), password: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw err("Invalid email or password", 401);
    }
    const token = signToken(user.id);
    res.json({ token, user: publicUser(user) });
  })
);

function getCookie(req, name) {
  const raw = req.headers.cookie || "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

// Start Google OAuth (redirects to accounts.google.com)
router.get(
  "/google",
  asyncHandler(async (req, res) => {
    if (!config.googleClientId) {
      throw err("Google OAuth is not configured (GOOGLE_CLIENT_ID missing)", 500);
    }
    const state = crypto.randomBytes(16).toString("hex");
    res.setHeader(
      "Set-Cookie",
      `google_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
    );
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", config.googleClientId);
    url.searchParams.set("redirect_uri", config.googleRedirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("access_type", "online");
    url.searchParams.set("prompt", "select_account");
    url.searchParams.set("state", state);
    res.redirect(url.toString());
  })
);

// Google OAuth callback: exchange code, upsert user, redirect back with JWT
router.get(
  "/google/callback",
  asyncHandler(async (req, res) => {
    const fail = (message) =>
      res.redirect(
        `${config.webOrigin}/login?google_error=${encodeURIComponent(message)}`
      );
    try {
      const { code, state, error } = req.query;
      if (error) return fail(`Google denied access: ${error}`);
      if (typeof state !== "string" || !code || state !== getCookie(req, "google_oauth_state")) {
        return fail("Invalid OAuth state");
      }
      res.clearCookie("google_oauth_state");

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: config.googleClientId,
          client_secret: config.googleClientSecret,
          redirect_uri: config.googleRedirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        return fail(tokenData.error_description || tokenData.error || "Could not exchange Google code");
      }

      const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const info = await infoRes.json();
      const email = String(info.email || "").toLowerCase();
      if (!email) return fail("Google did not return an email address");

      const { rows } = await db.query("SELECT id FROM users WHERE email = $1", [email]);
      let userId;
      if (rows.length > 0) {
        userId = rows[0].id;
        await db.query(
          `UPDATE users SET
             email_verified = TRUE,
             first_name = COALESCE(NULLIF($2, ''), first_name),
             last_name = COALESCE(NULLIF($3, ''), last_name),
             avatar = COALESCE(NULLIF($4, ''), avatar),
             updated_at = now()
           WHERE id = $1`,
          [userId, info.given_name || "", info.family_name || "", info.picture || ""]
        );
      } else {
        const ins = await db.query(
          `INSERT INTO users
            (email, password_hash, first_name, last_name, city, language,
             currency_pref, renter_enabled, owner_enabled, email_verified, avatar)
           VALUES ($1, '', $2, $3, '', 'en', 'ISK', TRUE, TRUE, TRUE, $4)
           RETURNING id`,
          [email, info.given_name || "", info.family_name || "", info.picture || ""]
        );
        userId = ins.rows[0].id;
      }

      const token = signToken(userId);
      res.redirect(`${config.webOrigin}/login?google_token=${encodeURIComponent(token)}`);
    } catch (e) {
      return fail(e.message || "Unexpected error during Google login");
    }
  })
);

router.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    res.json({ user: publicUser(req.user) });
  })
);

router.put(
  "/me",
  authRequired,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const cols = [];
    const vals = [];
    let i = 1;
    for (const [key, value] of Object.entries(req.body)) {
      const col = {
        firstName: "first_name",
        lastName: "last_name",
        phone: "phone",
        bio: "bio",
        city: "city",
        language: "language",
        currencyPref: "currency_pref",
        avatar: "avatar",
      }[key];
      if (col) {
        cols.push(`${col} = $${i++}`);
        vals.push(value);
      }
    }
    if (cols.length === 0) return res.json({ user: publicUser(req.user) });
    cols.push("updated_at = now()");
    const { rows } = await db.query(
      `UPDATE users SET ${cols.join(", ")} WHERE id = ${req.user.id} RETURNING *`,
      vals
    );
    res.json({ user: publicUser(rows[0]) });
  })
);

// MVP: self-verification marks email/phone; identity/business require admin.
router.put(
  "/me/verification",
  authRequired,
  validate(verifySchema),
  asyncHandler(async (req, res) => {
    const { emailVerified, phoneVerified } = req.body;
    const { rows } = await db.query(
      `UPDATE users
       SET email_verified = COALESCE($2, email_verified),
           phone_verified = COALESCE($3, phone_verified),
           updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.user.id, emailVerified, phoneVerified]
    );
    res.json({ user: publicUser(rows[0]) });
  })
);

router.get(
  "/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT * FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) throw err("User not found", 404);
    res.json({ user: publicUser(rows[0]) });
  })
);

module.exports = router;