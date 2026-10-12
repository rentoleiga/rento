import { getToken, apiBase } from "../api";

const SID_KEY = "rento_sid";
const HEARTBEAT_MS = 60000;
const MIN_GAP_MS = 10000;

let lastSent = 0;
let heartbeat = null;

function sessionId() {
  let sid = "";
  try {
    sid = localStorage.getItem(SID_KEY) || "";
  } catch {
    /* ignore */
  }
  if (!sid) {
    sid =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 32)
        : `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    try {
      localStorage.setItem(SID_KEY, sid);
    } catch {
      /* ignore */
    }
  }
  return sid;
}

function send(path) {
  const now = Date.now();
  if (now - lastSent < MIN_GAP_MS) return;
  lastSent = now;

  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  fetch(`${apiBase()}/api/track`, {
    method: "POST",
    headers,
    body: JSON.stringify({ sid: sessionId(), path }),
    keepalive: true,
  }).catch(() => {});
}

// Called on every route change.
export function trackVisit(path) {
  send(path || "/");
}

// Start the once-a-minute heartbeat (idempotent).
export function startTracking() {
  if (heartbeat) return;
  send(window.location.pathname);
  heartbeat = setInterval(() => {
    if (document.visibilityState === "visible") {
      send(window.location.pathname);
    }
  }, HEARTBEAT_MS);
}
