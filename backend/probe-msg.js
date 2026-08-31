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
  const owner = (await req("POST", "/api/auth/login", { body: { email: "business@rento.is", password: "password123" } })).data;
  const start = await req("POST", "/api/conversations", { token: renter.token, body: { listingId: 2, recipientId: 4, message: "Is the Land Cruiser available in August?" } });
  console.log("POST conv status:", start.status);
  const convId = start.data?.conversation?.id;
  console.log("convId:", convId, "keys:", start.data && Object.keys(start.data.conversation).slice(0,8));
  const msgs = await req("GET", `/api/conversations/${convId}/messages`, { token: owner.token });
  console.log("GET msgs status:", msgs.status, msgs.data);
  const reply = await req("POST", `/api/conversations/${convId}/messages`, { token: owner.token, body: { message: "Yes it is! When are you thinking?" } });
  console.log("reply status:", reply.status, reply.data);
  const unread = await req("GET", "/api/conversations/unread-count", { token: renter.token });
  console.log("unread:", unread.data);
  process.exit(0);
})();
