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
  resendApiKey: process.env.RESEND_API_KEY || "",
  mailFrom: process.env.MAIL_FROM || "Rentó <no-reply@rento.is>",
  siteUrl: process.env.SITE_URL || "https://www.rento.is",
  straumur: (() => {
    const env = String(process.env.STRAUMUR_ENV || "staging").toLowerCase() === "live" ? "live" : "staging";
    const apiKey = process.env.STRAUMUR_API_KEY || "";
    const terminalId = process.env.STRAUMUR_TERMINAL_ID || "";
    return {
      env,
      apiKey,
      terminalId,
      webhookApiKey: process.env.STRAUMUR_WEBHOOK_API_KEY || "",
      hmacKey: process.env.STRAUMUR_HMAC_KEY || "",
      // Straumur Theme editor key (Rentó branding on the hosted payment page).
      themeKey: "2213023-255e9",
      apiBase:
        process.env.STRAUMUR_API_BASE ||
        (env === "live"
          ? "https://greidslugatt.straumur.is/api/v1"
          : "https://checkout-api.staging.straumur.is/api/v1"),
      enabled: !!(apiKey && terminalId),
    };
  })(),
};