const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config");
const db = require("./db/pool");
const { notFound, errorHandler } = require("./middleware/http");
const { migrate } = require("./db/migrate");

const app = express();

// Railway/Vercel sit behind a proxy - needed for the audit log to record real IPs.
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Uploads are stored in Postgres so they survive redeploys. Older files that
// still exist on disk are served by express.static first.
app.use("/uploads", express.static(path.join(__dirname, "..", config.uploadDir)));
app.get("/uploads/:filename", async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "SELECT mime, data FROM uploads WHERE filename = $1",
      [req.params.filename]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.set("Content-Type", rows[0].mime);
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.send(rows[0].data);
  } catch (e) {
    next(e);
  }
});

// Health
app.get("/health", (req, res) => res.json({ ok: true, service: "rento-api" }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/locations", require("./routes/locations"));
app.use("/api/search", require("./routes/search"));
app.use("/api/listings", require("./routes/listings"));
app.use("/api/availability", require("./routes/availability"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/conversations", require("./routes/messages"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/users", require("./routes/users"));
app.use("/api/favorites", require("./routes/favorites"));
app.use("/api/home", require("./routes/home"));
app.use("/api/estimate", require("./routes/estimate"));
app.use("/api/credits", require("./routes/credits"));
app.use("/api/slots", require("./routes/slots"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/saved-searches", require("./routes/savedSearches"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/track", require("./routes/track"));
app.use("/api/admin", require("./routes/admin"));

app.use(notFound);
app.use(errorHandler);

migrate().then(() => {
  app.listen(config.port, () => {
    console.log(`Rento API listening on http://localhost:${config.port}`);
  });
  const { sendExpiryReminders, sendReturnReminders, cleanupOldNotifications } = require("./utils/slots");
  const runReminders = () =>
    Promise.all([
      sendExpiryReminders(),
      sendReturnReminders(),
      cleanupOldNotifications(),
    ]).catch((e) => console.error("reminders:", e.message));
  setTimeout(runReminders, 15000);
  setInterval(runReminders, 5 * 60 * 1000).unref();
});