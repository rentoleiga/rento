export const NOTIF_LABELS = {
  new_message: "Ný skilaboð",
  booking_request: "Ný bókunabeiðni",
  booking_confirmed: "Ný bókun",
  booking_approved: "Bókun samþykkt",
  booking_rejected: "Bókun hafnað",
  payment_success: "Greiðsla móttekin",
  booking_payment_reminder: "Áminning um greiðslu",
  new_review: "Ný umsögn",
  review_reply: "Svar við umsögn",
  saved_search_match: "Ný auglýsing passar við leit",
  favorite_price_drop: "Verðlækkun á uppáhaldi",
  listing_expiring: "Auglýsing rennur út",
  listing_expired: "Auglýsing runnin út",
  return_reminder: "Skilafrestur nálgast",
  phone_verified: "Símanúmer staðfest",
  password_changed: "Lykilorði breytt",
};

const PRIORITY = {
  booking_request: 0,
  booking_approved: 0,
  booking_rejected: 0,
  return_reminder: 0,
  listing_expiring: 0,
  listing_expired: 0,
  payment_success: 1,
  booking_payment_reminder: 1,
  new_message: 1,
  booking_confirmed: 1,
  new_review: 2,
  review_reply: 2,
  favorite_price_drop: 2,
  saved_search_match: 3,
  phone_verified: 4,
  password_changed: 4,
};

const rank = (n) => (PRIORITY[n.type] ?? 4) * 2 + (n.read_at ? 1 : 0);

export function sortNotifications(items = []) {
  return [...items].sort((a, b) => {
    const d = rank(a) - rank(b);
    if (d) return d;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
