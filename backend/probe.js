const BASE = "http://localhost:4000";
async function req(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  return { status: res.status, data };
}
(async () => {
  const renter = (await req("POST", "/api/auth/login", { body: { email: "demo.renter@rento.is", password: "password123" } })).data;
  const start = new Date(); start.setDate(start.getDate() + 10); start.setUTCHours(10, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 3);
  const r = await req("POST", "/api/bookings", {
    token: renter.token,
    body: { listingId: 1, start: start.toISOString(), end: end.toISOString(), message: "Hi! Is the camper free?" },
  });
  console.log("status", r.status);
  console.log(JSON.stringify(r.data, null, 1).slice(0, 1200));
  process.exit(0);
})();
