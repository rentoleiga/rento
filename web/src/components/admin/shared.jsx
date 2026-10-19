export const fmt = (n) => String(Number(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const fmtIsk = (n) => `${fmt(Math.round(Number(n || 0)))} kr.`;

export const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleString("is-IS", { dateStyle: "short", timeStyle: "short" }) : "";

export const ACTION_LABEL = {
  "user.role_change": "Changed role",
  "user.ban": "Suspended user",
  "user.unban": "Reinstated user",
  "listing.status": "Changed listing status",
  "listing.delete": "Deleted listing",
  "contact.new": "New contact message",
  "contact.answer": "Answered contact",
  "credit.purchase": "Bought credit",
  "credit.slot": "Bought slot",
  "credit.boost": "Boost",
  "credit.scan": "Ran credit scan",
  "credit.alert_reviewed": "Alert marked reviewed",
  "credit.alert_dismissed": "Alert dismissed",
  "password.link": "Generated password reset link",
};
export const actionLabel = (a) => ACTION_LABEL[a] || a;

const PILL_OK = ["published", "paid", "completed", "answered", "approved", "active", "returned", "verified", "reviewed"];
const PILL_WARN = ["pending", "new", "authorized", "draft", "payment_pending", "paused", "partially_refunded", "open"];
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

export const STATUS_LABEL = {
  published: "Published",
  draft: "Draft",
  paused: "Paused",
  suspended: "Suspended",
  deleted: "Deleted",
  pending: "Pending",
  approved: "Approved",
  payment_pending: "Payment pending",
  active: "Active",
  returned: "Returned",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
  paid: "Paid",
  authorized: "Authorized",
  failed: "Failed",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
  new: "New",
  answered: "Answered",
  purchase: "Purchase",
  slot: "Slot",
  boost: "Boost",
  renew: "Renew",
  addon: "Add-on",
  adjustment: "Adjustment",
  open: "Open",
  reviewed: "Reviewed",
  dismissed: "Dismissed",
};
export const statusLabel = (s) => STATUS_LABEL[s] || s;

export const TIER_LABEL = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  featured: "Silver",
  none: "—",
};
export const tierLabel = (t) => TIER_LABEL[t] || "—";
