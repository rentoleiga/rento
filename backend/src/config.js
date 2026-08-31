require("dotenv").config();

module.exports = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  jwtExpires: process.env.JWT_EXPIRES || "7d",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:4000",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB || "10", 10),
  webOrigin: process.env.WEB_ORIGIN || "http://localhost:5173",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:4000/api/auth/google/callback",
};