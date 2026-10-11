export const fmt = (n) => String(Number(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const fmtIsk = (n) => `${fmt(Math.round(Number(n || 0)))} kr.`;

export const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleString("is-IS", { dateStyle: "short", timeStyle: "short" }) : "";

export const ACTION_LABEL = {
  "user.role_change": "Breytti hlutverki",
  "user.ban": "Geymdir notanda",
  "user.unban": "Losnaði notanda",
  "listing.status": "Breytti stöðu auglýsingar",
  "listing.delete": "Eyddi auglýsingu",
  "contact.new": "Nýtt samband",
  "contact.answer": "Svaraði sambandi",
  "credit.purchase": "Keypti kredit",
  "credit.slot": "Keypti pláss",
  "credit.boost": "Boost",
};
export const actionLabel = (a) => ACTION_LABEL[a] || a;

const PILL_OK = ["published", "paid", "completed", "answered", "approved", "active", "returned", "verified"];
const PILL_WARN = ["pending", "new", "authorized", "draft", "payment_pending", "paused", "partially_refunded"];
const PILL_DANGER = ["suspended", "failed", "cancelled", "rejected", "deleted", "refunded", "banned"];

export function pillClass(status) {
  if (!status) return "pill";
  if (PILL_DANGER.includes(status)) return "pill pill-danger";
  if (PILL_WARN.includes(status)) return "pill pill-warn";
  if (PILL_OK.includes(status)) return "pill pill-ok";
  return "pill";
}

export function StatusPill({ status, label }) {
  if (!status) return null;
  return <span className={pillClass(status)}>{label || status}</span>;
}

export const STATUS_LABEL_IS = {
  published: "Birt",
  draft: "Uggr.",
  paused: "Pásu",
  suspended: "Geymdir",
  deleted: "Eyddir",
  pending: "Bið",
  approved: "Samþykkt",
  payment_pending: "Greiðslu í bið",
  active: "Virkt",
  returned: "Skilað",
  completed: "Lokið",
  cancelled: "Afbókað",
  rejected: "Hafnað",
  paid: "Greiðsla",
  authorized: "Heimilað",
  failed: "Misheppnað",
  refunded: "Endurgreitt",
  partially_refunded: "Hluta endurgreitt",
  new: "Nýtt",
  answered: "Svarað",
  purchase: "Kaup",
  slot: "Pláss",
  boost: "Boost",
  adjustment: "Aðlögun",
};
export const statusLabel = (s) => STATUS_LABEL_IS[s] || s;
