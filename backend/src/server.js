const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config");
const { notFound, errorHandler } = require("./middleware/http");
const { migrate } = require("./db/migrate");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "..", config.uploadDir)));

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

app.use(notFound);
app.use(errorHandler);

migrate().then(() => {
  app.listen(config.port, () => {
    console.log(`Rento API listening on http://localhost:${config.port}`);
  });
});