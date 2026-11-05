const BASE = import.meta.env.VITE_API_URL || "";
const MAX_REPORTS = 10;
const seen = new Set();
let sent = 0;

// Send a frontend/runtime error to the backend log. Deduplicated per session
// and capped so a render loop cannot flood the API.
export function reportError({ message, stack, url, context } = {}) {
  try {
    if (typeof window === "undefined" || sent >= MAX_REPORTS) return;
    const text = String(message || "").slice(0, 2000);
    if (!text) return;
    const href = String(url || window.location.href).slice(0, 500);
    const key = `${text}|${href}`;
    if (seen.has(key)) return;
    seen.add(key);
    sent += 1;

    const token = localStorage.getItem("rento_token") || "";
    fetch(`${BASE}/api/errors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: text,
        stack: String(stack || "").slice(0, 6000),
        url: href,
        context: context || {},
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never let monitoring break the app
  }
}

export function startMonitoring() {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (e) => {
    reportError({
      message: e.message || e.error?.message || "Script error",
      stack: e.error?.stack || "",
      url: window.location.href,
      context: { type: "error" },
    });
  });
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    reportError({
      message: (r && r.message) || String(r || "Unhandled rejection"),
      stack: (r && r.stack) || "",
      url: window.location.href,
      context: { type: "unhandledrejection" },
    });
  });
}
