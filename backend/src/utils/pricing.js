const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Calculate a rental price from a listing's pricing fields (spec section 17).
 * Priority: weekly (>=7 days) -> daily (>=1 day) -> hourly.
 * Sums base price + fees. Deposit is quoted separately and is NOT part of the
 * payable total for the owner (returned/released separately).
 */
function calcPrice(listing, start, end, extras = {}) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const hours = (endMs - startMs) / HOUR;
  const days = hours / 24;

  if (hours <= 0 || !isFinite(hours)) {
    throw new Error("Invalid booking period");
  }

  const {
    price_hourly,
    price_daily,
    price_weekly,
    price_monthly,
    cleaning_fee = 0,
    delivery_fee = 0,
    pickup_fee = 0,
    extra_fee = 0,
    deposit_amount = 0,
    minimum_duration = 1,
    minimum_duration_unit = "day",
  } = listing;

  const pick = Math.max(price_daily || 0, price_hourly || 0, price_weekly || 0);

  let base = 0;
  let duration = days;
  let durationUnit = "day";

  // Minimum duration enforcement
  if (minimum_duration_unit === "hour" && hours < minimum_duration) {
    throw new Error(
      `This item has a minimum rental period of ${minimum_duration} hours.`
    );
  } else if (minimum_duration_unit === "day" && days < minimum_duration) {
    throw new Error(
      `This item has a minimum rental period of ${minimum_duration} days.`
    );
  } else if (minimum_duration_unit === "week" && days < minimum_duration * 7) {
    throw new Error(
      `This item has a minimum rental period of ${minimum_duration} weeks.`
    );
  }

  if (days >= 7 && price_weekly) {
    const weeks = Math.floor(days / 7);
    const remainderDays = days - weeks * 7;
    base = weeks * price_weekly + Math.ceil(remainderDays) * (price_daily || pick);
    duration = weeks + remainderDays / 7;
    durationUnit = "week";
  } else if (days >= 1 && price_daily) {
    base = Math.max(1, Math.ceil(days)) * price_daily;
    duration = Math.max(1, Math.ceil(days));
  } else if (hours >= 1 && price_hourly) {
    base = Math.max(1, Math.ceil(hours)) * price_hourly;
    duration = Math.max(1, Math.ceil(hours));
    durationUnit = "hour";
  } else if (price_daily) {
    base = Math.max(1, Math.ceil(days)) * price_daily;
  } else if (price_hourly) {
    base = Math.max(1, Math.ceil(hours)) * price_hourly;
    duration = Math.max(1, Math.ceil(hours));
    durationUnit = "hour";
  } else {
    throw new Error("This listing has no price configured for the requested duration.");
  }

  const cleaning = Number(cleaning_fee) || 0;
  const delivery = Number(delivery_fee) || 0;
  const pickup = Number(pickup_fee) || 0;
  const extra = Number(extra_fee) || 0;
  const deposit = Number(deposit_amount) || 0;

  const extraFees = cleaning + delivery + pickup + extra;

  return {
    base: round2(base),
    duration: round2(duration),
    durationUnit,
    cleaningFee: round2(cleaning),
    deliveryFee: round2(delivery),
    pickupFee: round2(pickup),
    extraFee: round2(extra),
    extraFees: round2(extraFees),
    deposit: round2(deposit),
    total: round2(base + extraFees),
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function formatPrice(n, currency = "ISK") {
  return `${Number(n).toLocaleString("en-US")} ${currency === "EUR" ? "€" : "ISK"}`;
}

module.exports = { calcPrice, formatPrice };