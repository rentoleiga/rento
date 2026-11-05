const { Router } = require("express");
const db = require("../db/pool");
const config = require("../config");
const { asyncHandler } = require("../middleware/http");

const router = Router();

const STATIC_PATHS = [
  "/",
  "/search",
  "/how-it-works",
  "/calculator",
  "/promote",
  "/faq",
  "/safety",
  "/terms",
  "/privacy",
  "/cookies",
  "/banned",
  "/contact",
];

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const urlTag = (loc, lastmod, changefreq, priority) =>
  `<url><loc>${esc(loc)}</loc>${
    lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""
  }<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;

// GET /sitemap.xml -> static pages, categories and published listings.
router.get(
  "/sitemap.xml",
  asyncHandler(async (req, res) => {
    const base = String(config.siteUrl || "https://www.rento.is").replace(/\/$/, "");
    const [cats, listings] = await Promise.all([
      db.query(
        "SELECT slug FROM categories WHERE slug IS NOT NULL AND slug <> '' ORDER BY id"
      ),
      db.query(
        `SELECT slug, updated_at FROM listings
          WHERE status = 'published'
            AND (expires_at IS NULL OR expires_at > now())
          ORDER BY updated_at DESC NULLS LAST
          LIMIT 5000`
      ),
    ]);

    const urls = [];
    for (const p of STATIC_PATHS) {
      urls.push(urlTag(base + p, null, p === "/" ? "daily" : "weekly", p === "/" ? "1.0" : "0.7"));
    }
    for (const c of cats.rows) {
      urls.push(urlTag(`${base}/search?category=${encodeURIComponent(c.slug)}`, null, "daily", "0.6"));
    }
    for (const l of listings.rows) {
      urls.push(urlTag(`${base}/listing/${encodeURIComponent(l.slug)}`, l.updated_at, "weekly", "0.8"));
    }

    res
      .type("application/xml")
      .set("Cache-Control", "public, max-age=3600")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
          "\n"
        )}\n</urlset>`
      );
  })
);

module.exports = router;
