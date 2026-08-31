const BASE = process.env.BASE_URL || "http://localhost:4000";

async function req(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const e = new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(data)}`);
    e.data = data;
    throw e;
  }
  return data;
}

let passed = 0;
let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (e) {
    console.log(`  FAIL  ${name} -> ${e.message}`);
    failed++;
  }
}

(async () => {
  console.log("=== API integration tests ===");
  const owner = await req("POST", "/api/auth/login", {
    body: { email: "demo.owner@rento.is", password: "password123" },
  });
  const renter = await req("POST", "/api/auth/login", {
    body: { email: "demo.renter@rento.is", password: "password123" },
  });
  const business = await req("POST", "/api/auth/login", {
    body: { email: "business@rento.is", password: "password123" },
  });
  // The camper (listing 1) is owned by the business account
  const camperOwner = business;

  await check("login returns tokens", async () => {
    if (!owner.token || !renter.token) throw new Error("no token");
    if (owner.user.email !== "demo.owner@rento.is") throw new Error("wrong user");
  });

  await check("GET /api/categories", async () => {
    const d = await req("GET", "/api/categories");
    if (d.categories.length < 7) throw new Error("expected >=7 top categories");
    if (d.categories[0].name !== "Vehicles") throw new Error("translation missing");
  });

  await check("GET /api/categories/vehicles has subcategories", async () => {
    const d = await req("GET", "/api/categories/vehicles");
    if (d.subcategories.length < 5) throw new Error("expected subcategories");
  });

  await check("GET /api/locations", async () => {
    const d = await req("GET", "/api/locations");
    if (d.locations.length < 9) throw new Error("expected 9 locations");
    if (d.locations[0].listing_count < 1) throw new Error("listing count missing");
  });

  await check("search finds campervan by keyword", async () => {
    const d = await req("GET", "/api/search?keyword=camper&sort=recommended");
    if (d.total < 1) throw new Error("expected results");
  });

  await check("search filters by category", async () => {
    const d = await req("GET", "/api/search?category=vehicles");
    if (d.total < 3) throw new Error("expected vehicles");
  });

  await check("search filters by availability window", async () => {
    const start = new Date(); start.setDate(start.getDate() + 3); start.setUTCHours(10, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 3);
    const q = `/api/search?category=campervans&start=${start.toISOString()}&end=${end.toISOString()}`;
    const d = await req("GET", q);
    if (d.total < 1) throw new Error("expected available campervan in window");
  });

  await check("search respects blocked periods", async () => {
    const start = new Date(); start.setDate(start.getDate() + 5); start.setUTCHours(9, 0, 0, 0);
    const end = new Date(); end.setDate(end.getDate() + 6); end.setUTCHours(9, 0, 0, 0);
    const d = await req("GET", `/api/search?keyword=Land%20Cruiser&start=${start.toISOString()}&end=${end.toISOString()}`);
    // Land Cruiser is blocked days 5-7
    const found = d.results.find((r) => r.slug === "land-cruiser-4x4-diesel");
    if (found) throw new Error("blocked Land Cruiser should not be available");
  });

  await check("listing detail returns owner + attributes", async () => {
    const d = await req("GET", "/api/listings/toyota-hiace-camper-4-berth?inc=1");
    if (d.listing.slug !== "toyota-hiace-camper-4-berth") throw new Error("slug mismatch");
    if (!d.listing.attributes || d.listing.attributes.make !== "Toyota") throw new Error("attributes missing");
    if (d.listing.rating === 0) throw new Error("rating missing");
  });

  await check("quote computes daily price + fees", async () => {
    const start = new Date(); start.setDate(start.getDate() + 3); start.setUTCHours(10, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 2);
    const d = await req("POST", "/api/bookings/listings/1/quote", {
      body: { start: start.toISOString(), end: end.toISOString() },
    });
    const expectedBase = 45000 * 2;
    if (d.base !== expectedBase) throw new Error(`expected base ${expectedBase}, got ${d.base}`);
    if (d.deposit !== 150000) throw new Error(`expected deposit 150000, got ${d.deposit}`);
  });

  await check("favorite add/remove", async () => {
    await req("POST", "/api/listings/2/favorite", { token: renter.token });
    const favs = await req("GET", "/api/favorites", { token: renter.token });
    if (!favs.favorites.some((f) => f.id === 2)) throw new Error("favorite missing");
    await req("DELETE", "/api/listings/2/favorite", { token: renter.token });
    const favs2 = await req("GET", "/api/favorites", { token: renter.token });
    if (favs2.favorites.some((f) => f.id === 2)) throw new Error("favorite not removed");
  });

  // Booking flow
  let bookingId;
  await check("create booking request (pending)", async () => {
    const start = new Date(); start.setDate(start.getDate() + 10); start.setUTCHours(10, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 3);
    const d = await req("POST", "/api/bookings", {
      token: renter.token,
      body: { listingId: 1, start: start.toISOString(), end: end.toISOString(), message: "Hi! Is the camper free?" },
    });
    bookingId = d.booking.id;
    if (d.booking.status !== "pending") throw new Error("expected pending");
    if (d.booking.total !== 45000 * 3 + 15000 + 5000 + 15000) {
      throw new Error(`total mismatch: ${d.booking.total}`);
    }
  });

  await check("availability now blocked for booking", async () => {
    const d = await req("GET", "/api/availability/check?listing_id=1&start=" + encodeURIComponent(new Date(new Date().getTime() + 10*86400000).toISOString()) + "&end=" + encodeURIComponent(new Date(new Date().getTime() + 13*86400000).toISOString()));
    if (d.available) throw new Error("expected unavailable after booking");
  });

  await check("owner approves booking", async () => {
    const d = await req("PUT", `/api/bookings/${bookingId}/status`, {
      token: camperOwner.token,
      body: { action: "approve" },
    });
    if (d.booking.status !== "approved") throw new Error("expected approved");
  });

  await check("renter pays (mock)", async () => {
    const d = await req("PUT", `/api/bookings/${bookingId}/status`, {
      token: renter.token,
      body: { action: "pay" },
    });
    if (d.booking.status !== "active") throw new Error("expected active");
    if (d.booking.paymentStatus !== "paid") throw new Error("expected paid");
  });

  await check("owner pickup", async () => {
    const d = await req("PUT", `/api/bookings/${bookingId}/status`, {
      token: camperOwner.token,
      body: { action: "pickup" },
    });
    if (d.booking.pickupStatus !== "picked_up") throw new Error("expected picked_up");
  });

  await check("renter return", async () => {
    const d = await req("PUT", `/api/bookings/${bookingId}/status`, {
      token: renter.token,
      body: { action: "return" },
    });
    if (d.booking.status !== "returned") throw new Error("expected returned");
  });

  await check("owner completes", async () => {
    const d = await req("PUT", `/api/bookings/${bookingId}/status`, {
      token: camperOwner.token,
      body: { action: "complete" },
    });
    if (d.booking.status !== "completed") throw new Error("expected completed");
  });

await check("review after completion (renter -> owner)", async () => {
    const d = await req("POST", `/api/reviews/bookings/${bookingId}/review`, {
      token: renter.token,
      body: {
        rating: 5,
        communicationRating: 5,
        accuracyRating: 5,
        cleanlinessRating: 4,
        pickupRating: 5,
        comment: "Great camper, highly recommended.",
      },
    });
    if (!d.ok) throw new Error("review failed");
  });

  await check("reviews appear on listing", async () => {
    const d = await req("GET", "/api/reviews/listing/1");
    if (d.reviews.length < 1) throw new Error("expected reviews");
  });

  await check("owner listing rating updated", async () => {
    const d = await req("GET", "/api/users/4");
    if (Number(d.user.rating) < 4) throw new Error("rating not aggregated");
  });

  await check("messaging flow", async () => {
    const lc = await req("GET", "/api/listings/2", {});
    const ownerId = lc.listing.owner.id;
    const start = await req("POST", "/api/conversations", {
      token: renter.token,
      body: { listingId: 2, recipientId: ownerId, message: "Is the Land Cruiser available in August?" },
    });
    const convId = start.conversation.id;
    const msgs = await req("GET", `/api/conversations/${convId}/messages`, { token: camperOwner.token });
    if (msgs.messages.length < 1) throw new Error("expected messages");
    await req("POST", `/api/conversations/${convId}/messages`, {
      token: camperOwner.token,
      body: { message: "Yes it is! When are you thinking?" },
    });
    const unread = await req("GET", "/api/conversations/unread-count", { token: renter.token });
    if (unread.unread < 1) throw new Error(`expected unread, got ${unread.unread}`);
  });

await check("notifications created", async () => {
    const ownerNotifs = await req("GET", "/api/notifications", { token: camperOwner.token });
    const ownerTypes = ownerNotifs.notifications.map((n) => n.type);
    if (!ownerTypes.includes("booking_request") || !ownerTypes.includes("payment_success")) {
      throw new Error(`owner missing booking_request/payment_success: ${ownerTypes.join(",")}`);
    }
    const renterNotifs = await req("GET", "/api/notifications", { token: renter.token });
    const renterTypes = renterNotifs.notifications.map((n) => n.type);
    if (!renterTypes.includes("booking_approved")) {
      throw new Error(`renter missing booking_approved: ${renterTypes.join(",")}`);
    }
  });

  await check("dashboard overview", async () => {
    const d = await req("GET", "/api/dashboard/overview", { token: camperOwner.token });
    if (d.owner.listingsActive < 1) throw new Error("expected active listings");
    if (d.owner.revenue < 1) throw new Error("expected revenue");
  });

  await check("renter bookings list", async () => {
    const d = await req("GET", "/api/dashboard/renter/bookings", { token: renter.token });
    if (d.bookings.length < 1) throw new Error("expected bookings");
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();



