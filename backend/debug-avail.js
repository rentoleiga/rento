const { checkAvailability } = require("./src/utils/availability");
(async () => {
  const s = new Date(); s.setDate(s.getDate() + 10); s.setUTCHours(10,0,0,0);
  const e = new Date(s); e.setDate(s.getDate() + 3);
  console.log("start:", s.toISOString(), "end:", e.toISOString());
  console.log(JSON.stringify(await checkAvailability(1, s.toISOString(), e.toISOString()), null, 1));
  process.exit(0);
})();
