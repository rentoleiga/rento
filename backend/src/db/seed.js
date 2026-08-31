const bcrypt = require("bcryptjs");
const { pool } = require("./pool");

const now = new Date();
const iso = now.toISOString();

async function clearAll() {
  await pool.query(`
    TRUNCATE notifications, reviews, messages, conversations, transactions,
      favorites, bookings, availability, listing_images, listings,
      category_translations, categories, locations, users
    RESTART IDENTITY CASCADE
  `);
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seed() {
  const hash = await bcrypt.hash("password123", 10);
  await clearAll();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ---------- USERS ----------
    const users = await client.query(`
      INSERT INTO users
        (email, password_hash, first_name, last_name, city, bio, avatar,
         role, email_verified, phone_verified, identity_verified,
         business_verified, listing_verified, rating, review_count,
         response_rate, response_time, owner_enabled, renter_enabled, business_account)
      VALUES
        ('demo.owner@rento.is', $1, 'Jon', 'Jonsson', 'Reykjavik',
         'Owner of a small fleet of campervans and 4x4s. Family friendly.',
         'https://i.pravatar.cc/150?u=jon', 'user', true, true, true, false, true,
         4.9, 34, 98, 11, true, true, false),
        ('demo.renter@rento.is', $1, 'Anna', 'Sigurdsdottir', 'Akureyri',
         'Love the outdoors, fishing and road trips around the ring road.',
         'https://i.pravatar.cc/150?u=anna', 'user', true, true, false, false, false,
         0, 0, 100, 5, true, true, false),
        ('admin@rento.is', $1, 'Admin', 'System', 'Reykjavik', 'Platform administrator.',
         'https://i.pravatar.cc/150?u=admin', 'admin', true, true, true, true, true,
         0, 0, 100, 1, true, true, false),
        ('business@rento.is', $1, 'Reykjavik', 'Rentals Ltd', 'Keflavik',
         'Professional rental business with a fleet at KEF airport.',
         'https://i.pravatar.cc/150?u=business', 'user', true, true, true, true, true,
         4.7, 120, 99, 8, true, true, true)
      RETURNING id, email
    `, [hash]);
    const byEmail = {};
    users.rows.forEach((u) => { byEmail[u.email] = u.id; });

    // ---------- CATEGORIES ----------
    const cats = [
      // top-level (parent_id NULL)
      { slug: "vehicles", icon: "directions_car", en: "Vehicles", is: "Ökutæki", sort: 1 },
      { slug: "camping", icon: "camping", en: "Camping", is: "Tjaldvistar", sort: 2 },
      { slug: "outdoor", icon: "hiking", en: "Outdoor", is: "Útivist", sort: 3 },
      { slug: "baby-family", icon: "child_care", en: "Baby & Family", is: "Börn og fjölskylda", sort: 4 },
      { slug: "tools-equipment", icon: "handyman", en: "Tools & Equipment", is: "Verkfæri og búnaður", sort: 5 },
      { slug: "event-equipment", icon: "celebration", en: "Event Equipment", is: "Viðburðabúnaður", sort: 6 },
      { slug: "photo-video", icon: "photo_camera", en: "Photo & Video", is: "Ljósmynd og myndband", sort: 7 },
      { slug: "garden", icon: "yard", en: "Gardening", is: "Garður og lóð", sort: 8 },
      { slug: "cleaning", icon: "cleaning_services", en: "Cleaning", is: "Þrif", sort: 9 },
      { slug: "office", icon: "business_center", en: "Office", is: "Skrifstofa", sort: 10 },
      { slug: "sports", icon: "sports_soccer", en: "Sports & Games", is: "Íþróttir og leikir", sort: 11 },
    ];

    const catIds = {};
    for (const c of cats) {
      const r = await client.query(
        `INSERT INTO categories (slug, icon, sort_order)
         VALUES ($1,$2,$3) ON CONFLICT (slug) DO UPDATE SET icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order
         RETURNING id, slug`,
        [c.slug, c.icon, c.sort]
      );
      catIds[c.slug] = r.rows[0].id;
      await client.query(
        `INSERT INTO category_translations (category_id, language, name) VALUES
         ($1,'en',$2), ($1,'is',$3) ON CONFLICT DO NOTHING`,
        [r.rows[0].id, c.en, c.is]
      );
    }

    const subs = [
      { parent: "vehicles", slug: "cars", en: "Cars", is: "Bílar" },
      { parent: "vehicles", slug: "4x4", en: "4x4", is: "4x4" },
      { parent: "vehicles", slug: "campervans", en: "Campervans", is: "Húsbílar" },
      { parent: "vehicles", slug: "motorhomes", en: "Motorhomes", is: "Hjólhýsi" },
      { parent: "vehicles", slug: "motorcycles", en: "Motorcycles", is: "Mótorhjól" },
      { parent: "vehicles", slug: "scooters", en: "Scooters", is: "Vespur" },
      { parent: "vehicles", slug: "trailers", en: "Trailers", is: "Kerru" },
      { parent: "vehicles", slug: "bikes", en: "Bikes", is: "Hjól" },
      { parent: "vehicles", slug: "e-bikes", en: "E-bikes", is: "Rafhjól" },
      { parent: "camping", slug: "tents", en: "Tents", is: "Tjöld" },
      { parent: "camping", slug: "sleeping-bags", en: "Sleeping bags", is: "Svefnpokar" },
      { parent: "camping", slug: "camping-furniture", en: "Camping furniture", is: "Tjaldhúsgögn" },
      { parent: "camping", slug: "camping-kitchens", en: "Camping kitchens", is: "Tjaldeldavélar" },
      { parent: "camping", slug: "stoves", en: "Stoves", is: "Eldavélar" },
      { parent: "camping", slug: "outdoor-equipment", en: "Outdoor equipment", is: "Útivistarbúnaður" },
      { parent: "outdoor", slug: "hiking-equipment", en: "Hiking equipment", is: "Göngubúnaður" },
      { parent: "outdoor", slug: "fishing-equipment", en: "Fishing equipment", is: "Veiðibúnaður" },
      { parent: "outdoor", slug: "kayaks", en: "Kayaks", is: "Keilur" },
      { parent: "outdoor", slug: "sup", en: "SUP boards", is: "SUP borð" },
      { parent: "outdoor", slug: "snow-equipment", en: "Snow equipment", is: "Snjóbúnaður" },
      { parent: "outdoor", slug: "climbing-equipment", en: "Climbing equipment", is: "Klifurbúnaður" },
      { parent: "baby-family", slug: "baby-seats", en: "Baby seats", is: "Barna sæti" },
      { parent: "baby-family", slug: "strollers", en: "Strollers", is: "Kerrabörn" },
      { parent: "baby-family", slug: "baby-beds", en: "Baby beds", is: "Barna rúm" },
      { parent: "baby-family", slug: "car-seats", en: "Car seats", is: "Bílstólar" },
      { parent: "baby-family", slug: "child-carriers", en: "Child carriers", is: "Barnaburðar" },
      { parent: "tools-equipment", slug: "power-tools", en: "Power tools", is: "Raftól" },
      { parent: "tools-equipment", slug: "construction-equipment", en: "Construction equipment", is: "Byggingarbúnaður" },
      { parent: "tools-equipment", slug: "generators", en: "Generators", is: "Rafalar" },
      { parent: "tools-equipment", slug: "ladders", en: "Ladders", is: "Stigar" },
      { parent: "tools-equipment", slug: "cleaning-equipment", en: "Cleaning equipment", is: "Hreinsibúnaður" },
      { parent: "tools-equipment", slug: "garden-equipment", en: "Garden equipment", is: "Garðbúnaður" },
      { parent: "event-equipment", slug: "tables", en: "Tables", is: "Borð" },
      { parent: "event-equipment", slug: "chairs", en: "Chairs", is: "Stólar" },
      { parent: "event-equipment", slug: "speakers", en: "Speakers", is: "Hátalarar" },
      { parent: "event-equipment", slug: "lighting", en: "Lighting", is: "Lýsing" },
      { parent: "event-equipment", slug: "projectors", en: "Projectors", is: "Skjávarpar" },
      { parent: "event-equipment", slug: "tents", en: "Tents", is: "Tjöld" },
      { parent: "photo-video", slug: "cameras", en: "Cameras", is: "Myndavélar" },
      { parent: "photo-video", slug: "lenses", en: "Lenses", is: "Linsur" },
      { parent: "photo-video", slug: "drones", en: "Drones", is: "Drónar" },
      { parent: "photo-video", slug: "lighting", is: "Lýsing", en: "Lighting" },
      { parent: "photo-video", slug: "audio", en: "Audio", is: "Hljóð" },
      { parent: "garden", slug: "lawn-mowers", en: "Lawn mowers", is: "Garðsláttuvélar" },
      { parent: "garden", slug: "garden-tools", en: "Garden tools", is: "Garðverkfæri" },
      { parent: "garden", slug: "grills", en: "Grills & BBQs", is: "Grill" },
      { parent: "garden", slug: "hedge-trimmers", en: "Hedge trimmers", is: "Limgerðisklipparar" },
      { parent: "garden", slug: "chainsaws", en: "Chainsaws", is: "Keðjusagir" },
      { parent: "cleaning", slug: "pressure-washers", en: "Pressure washers", is: "Háþrýstidælur" },
      { parent: "cleaning", slug: "carpet-cleaners", en: "Carpet cleaners", is: "Teppahreinsivélar" },
      { parent: "cleaning", slug: "vacuums", en: "Vacuums", is: "Ryksugur" },
      { parent: "cleaning", slug: "floor-scrubbers", en: "Floor scrubbers", is: "Gólfþvottavélar" },
      { parent: "office", slug: "laptops", en: "Laptops", is: "Fartölvur" },
      { parent: "office", slug: "printers", en: "Printers", is: "Prentarar" },
      { parent: "office", slug: "whiteboards", en: "Whiteboards", is: "Töflur" },
      { parent: "sports", slug: "golf", en: "Golf equipment", is: "Golfbúnaður" },
      { parent: "sports", slug: "ball-sports", en: "Ball sports", is: "Knattleiksbúnaður" },
      { parent: "sports", slug: "fitness", en: "Fitness & yoga", is: "Fitness og jóga" },
      { parent: "sports", slug: "skateboards", en: "Skateboards & scooters", is: "Bretti og hlaupahjól" },
    ];

    const subIds = {};
    for (const s of subs) {
      const r = await client.query(
        `INSERT INTO categories (parent_id, slug, icon, sort_order)
         VALUES ($1,$2,'',0) ON CONFLICT (slug) DO UPDATE SET parent_id=EXCLUDED.parent_id
         RETURNING id, slug`,
        [catIds[s.parent], s.slug]
      );
      subIds[s.slug] = r.rows[0].id;
      await client.query(
        `INSERT INTO category_translations (category_id, language, name) VALUES
         ($1,'en',$2), ($1,'is',$3) ON CONFLICT DO NOTHING`,
        [r.rows[0].id, s.en, s.is]
      );
    }

    // ---------- LOCATIONS ----------
    const locs = [
      { slug: "reykjavik", city: "Reykjavík", region: "Capital Region", municipality: "Reykjavíkurborg", lat: 64.1466, lng: -21.9426, airport: "Reykjavík Airport (RKV)", dist: 2 },
      { slug: "keflavik", city: "Keflavík", region: "Southern Peninsula", municipality: "Reykjanesbær", lat: 64.0123, lng: -22.5692, airport: "Keflavík International Airport (KEF)", dist: 4 },
      { slug: "akureyri", city: "Akureyri", region: "Northeastern Region", municipality: "Akureyrarbær", lat: 65.6885, lng: -18.1262, airport: "Akureyri Airport (AEY)", dist: 4 },
      { slug: "selfoss", city: "Selfoss", region: "Southern Region", municipality: "Árborg", lat: 63.9332, lng: -21.0007, airport: "Keflavík International Airport (KEF)", dist: 95 },
      { slug: "vik", city: "Vík", region: "Southern Region", municipality: "Mýrdalshreppur", lat: 63.4189, lng: -19.0060, airport: "Keflavík International Airport (KEF)", dist: 185 },
      { slug: "hella", city: "Hella", region: "Southern Region", municipality: "Rangárþing ytra", lat: 63.8347, lng: -20.3896, airport: "Keflavík International Airport (KEF)", dist: 120 },
      { slug: "hofn", city: "Höfn", region: "Eastern Region", municipality: "Hornafjörður", lat: 64.2536, lng: -15.2082, airport: "Hornafjörður Airport (HFN)", dist: 5 },
      { slug: "egilsstadir", city: "Egilsstaðir", region: "Eastern Region", municipality: "Múlaþing", lat: 65.2663, lng: -14.3949, airport: "Egilsstaðir Airport (EGS)", dist: 3 },
      { slug: "isafjordur", city: "Ísafjörður", region: "Westfjords", municipality: "Ísafjarðarbær", lat: 66.0747, lng: -23.1179, airport: "Ísafjörður Airport (IFJ)", dist: 4 },
      { slug: "kopavogur", city: "Kópavogur", region: "Capital Region", municipality: "Kópavogsbær", lat: 64.1114, lng: -21.8995, airport: "Reykjavík Airport (RKV)", dist: 8 },
      { slug: "gardabaer", city: "Garðabær", region: "Capital Region", municipality: "Garðabær", lat: 64.0920, lng: -21.9268, airport: "Reykjavík Airport (RKV)", dist: 10 },
      { slug: "hafnarfjordur", city: "Hafnarfjörður", region: "Capital Region", municipality: "Hafnarfjarðarbær", lat: 64.0671, lng: -21.9377, airport: "Reykjavík Airport (RKV)", dist: 12 },
      { slug: "mosfellsbaer", city: "Mosfellsbær", region: "Capital Region", municipality: "Mosfellsbær", lat: 64.1655, lng: -21.7011, airport: "Reykjavík Airport (RKV)", dist: 15 },
      { slug: "seltjarnarnes", city: "Seltjarnarnes", region: "Capital Region", municipality: "Seltjarnarnesbær", lat: 64.1479, lng: -22.0130, airport: "Reykjavík Airport (RKV)", dist: 4 },
      { slug: "grindavik", city: "Grindavík", region: "Southern Peninsula", municipality: "Grindavíkurbær", lat: 63.8390, lng: -22.4350, airport: "Keflavík International Airport (KEF)", dist: 30 },
      { slug: "akranes", city: "Akranes", region: "Western Region", municipality: "Akraneskaupstaður", lat: 64.3219, lng: -22.0702, airport: "Reykjavík Airport (RKV)", dist: 49 },
      { slug: "borgarnes", city: "Borgarnes", region: "Western Region", municipality: "Borgarbyggð", lat: 64.5385, lng: -21.9207, airport: "Reykjavík Airport (RKV)", dist: 105 },
      { slug: "stykkisholmur", city: "Stykkishólmur", region: "Western Region", municipality: "Stykkishólmsbær", lat: 65.0767, lng: -22.7289, airport: "Reykjavík Airport (RKV)", dist: 170 },
      { slug: "saudarkrokur", city: "Sauðárkrókur", region: "Northwestern Region", municipality: "Sveitarfélagið Skagafjörður", lat: 65.7461, lng: -19.6390, airport: "Keflavík International Airport (KEF)", dist: 285 },
      { slug: "husavik", city: "Húsavík", region: "Northeastern Region", municipality: "Norðurþing", lat: 66.0452, lng: -17.3462, airport: "Keflavík International Airport (KEF)", dist: 440 },
      { slug: "seydisfjordur", city: "Seyðisfjörður", region: "Eastern Region", municipality: "Seyðisfjarðarkaupstaður", lat: 65.2610, lng: -14.0083, airport: "Egilsstaðir Airport (EGS)", dist: 26 },
      { slug: "hveragerdi", city: "Hveragerði", region: "Southern Region", municipality: "Hveragerðisbær", lat: 64.0008, lng: -21.1810, airport: "Keflavík International Airport (KEF)", dist: 35 },
      { slug: "patreksfjordur", city: "Patreksfjörður", region: "Westfjords", municipality: "Vesturbyggð", lat: 65.5954, lng: -23.9957, airport: "Ísafjörður Airport (IFJ)", dist: 190 },
    ];
    const locIds = {};
    for (const l of locs) {
      const r = await client.query(
        `INSERT INTO locations (slug, city, region, municipality, latitude, longitude, airport_name, airport_distance)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (slug) DO NOTHING RETURNING id, slug`,
        [l.slug, l.city, l.region, l.municipality, l.lat, l.lng, l.airport, l.dist]
      );
      locIds[l.slug] = r.rows[0].id;
    }

    // ---------- LISTINGS ----------
    const future = (days, hour = 10) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      d.setHours(hour, 0, 0, 0);
      return d;
    };

    const listings = [
      {
        owner: "business@rento.is", cat: "vehicles", sub: "campervans", slug: "toyota-hiace-camper-4-berth",
        title: "Toyota Hiace Camper - 4 berth, full kitchen",
        subtitle: "Fully equipped campervan for the ring road",
        description: "A reliable Toyota Hiace converted camper with a comfortable double bed and two single beds, full kitchen with stove and fridge, heaters and plenty of storage. Perfect for a family road trip around the ring road. Includes sleeping bags, pillows and kitchen basics.",
        price_daily: 45000, price_weekly: 280000, deposit: 150000, cleaning_fee: 15000, pickup_fee: 5000, delivery_fee: 15000,
        city: "Keflavík", lat: 64.0123, lng: -22.5692, airport_name: "Keflavík International Airport (KEF)", airport_distance: 4,
        attributes: { make: "Toyota", model: "Hiace", year: 2019, sleeping_capacity: 4, beds: "1 double + 2 single", kitchen: true, toilet: false, shower: false, heating: true, automatic: true, fuel: "Diesel", mileage: 94000, insurance: true, registration_number: "ABC123", condition: "good" },
        featured: true, featured_until: new Date(now.getTime() + 30 * 86400000).toISOString(),
        promotion_tier: "platinum", promotion_until: new Date(now.getTime() + 30 * 86400000).toISOString(),
        rating: 4.9, review_count: 34, view_count: 1240, favorite_count: 88,
        min_duration_unit: "day", minimum_duration: 2,
      },
      {
        owner: "business@rento.is", cat: "vehicles", sub: "4x4", slug: "land-cruiser-4x4-diesel",
        title: "Toyota Land Cruiser 4x4 - 5 seats",
        subtitle: "Go anywhere in Iceland",
        description: "Toyota Land Cruiser, the ultimate Icelandic highland vehicle. Five seats, plenty of space for gear, snorkel and all-terrain tyres. Perfect for the highlands, F-roads and fjords. 250km/day included.",
        price_hourly: 4500, price_daily: 52000, price_weekly: 320000, deposit: 200000, cleaning_fee: 10000, delivery_fee: 15000, pickup_fee: 5000,
        city: "Reykjavík", lat: 64.1466, lng: -21.9426,
        attributes: { make: "Toyota", model: "Land Cruiser", year: 2018, seats: 5, doors: 5, transmission: "automatic", fuel: "Diesel", "4x4": true, mileage: 132000, insurance: true, registration_number: "DEF456", condition: "good" },
        featured: true, featured_until: new Date(now.getTime() + 20 * 86400000).toISOString(),
        promotion_tier: "gold", promotion_until: new Date(now.getTime() + 20 * 86400000).toISOString(),
        rating: 4.8, review_count: 56, view_count: 2210, favorite_count: 142,
        min_duration_unit: "day", minimum_duration: 2,
      },
      {
        owner: "demo.owner@rento.is", cat: "camping", sub: "tents", slug: "expedition-tent-4-season",
        title: "Expedition 4-season tent, sleeps 4",
        subtitle: "Storm proof tent for southern Iceland",
        description: "High quality 4 season expedition tent. Wind and weather proof, sleeps four comfortably with a large vestibule for gear. Includes groundsheet, repair kit and footprint. Ideal for camping trips around the south coast and highlands.",
        price_daily: 3500, price_weekly: 20000, deposit: 20000, cleaning_fee: 2000,
        city: "Selfoss", lat: 63.9332, lng: -21.0007,
        attributes: { brand: "Hilleberg", model: "Saivo 4", size: "4 persons", weight: "5.2 kg", skill_level: "Intermediate", condition: "like_new" },
        rating: 5.0, review_count: 12, view_count: 540, favorite_count: 31,
        min_duration_unit: "day", minimum_duration: 1,
      },
      {
        owner: "demo.owner@rento.is", cat: "outdoor", sub: "fishing-equipment", slug: "fly-fishing-kit-complete",
        title: "Complete fly fishing kit",
        subtitle: "Rod, reel, waders and flies for salmon rivers",
        description: "Complete fly fishing kit for the great salmon rivers of Iceland. Includes rod (9ft 5wt), reel, line, waders, boots, flies and a rod case. Perfect for the Laxá or Blanda rivers. A fishing permit guidance sheet is included.",
        price_daily: 4000, price_weekly: 24000, deposit: 30000,
        city: "Akureyri", lat: 65.6885, lng: -18.1262,
        attributes: { brand: "Sage", model: "Z-Axis", recommended_age: "16+", skill_level: "Intermediate", condition: "good" },
        rating: 4.7, review_count: 18, view_count: 380, favorite_count: 22,
        min_duration_unit: "day", minimum_duration: 3,
      },
      {
        owner: "demo.owner@rento.is", cat: "baby-family", sub: "car-seats", slug: "baby-car-seat-group-0-1",
        title: "Baby car seat (Group 0-1)",
        subtitle: "ISOFIX compatible, safety tested",
        description: "Safe and clean baby car seat suitable from birth to 4 years (0-18kg). ISOFIX and seat belt installation. Includes instruction manual and safety certification. Cleaned and sanitised after every rental.",
        price_daily: 1500, price_weekly: 8000, deposit: 15000, cleaning_fee: 1000,
        city: "Vík", lat: 63.4189, lng: -19.0060,
        attributes: { brand: "Britax", model: "Römer", age_range: "0-4 years", weight_range: "0-18 kg", safety_certification: "ECE R44/04", condition: "good" },
        rating: 4.9, review_count: 22, view_count: 610, favorite_count: 44,
        min_duration_unit: "day", minimum_duration: 3,
        category_attr_needs: "baby", // for demo of conditional fields
      },
      {
        owner: "demo.owner@rento.is", cat: "tools-equipment", sub: "generators", slug: "honda-generator-2-2kw",
        title: "Honda 2.2kW inverter generator",
        subtitle: "Quiet power anywhere",
        description: "Quiet Honda EU22i inverter generator. Perfect for campervan top-ups, events or construction. Fuel efficient and runs for up to 8 hours on a full tank. Includes extension leads and fuel canister.",
        price_daily: 3000, price_hourly: 600, price_weekly: 18000, deposit: 25000,
        city: "Hella", lat: 63.8347, lng: -20.3896,
        attributes: { brand: "Honda", model: "EU22i", power: "2.2 kW", voltage: "230V", fuel_type: "Petrol", weight: "21 kg", condition: "good" },
        rating: 4.6, review_count: 9, view_count: 290, favorite_count: 12,
        promotion_tier: "featured", promotion_until: new Date(now.getTime() + 7 * 86400000).toISOString(),
        min_duration_unit: "day", minimum_duration: 1,
      },
      {
        owner: "demo.owner@rento.is", cat: "photo-video", sub: "cameras", slug: "sony-a7iv-mirrorless-kit",
        title: "Sony A7 IV mirrorless camera kit",
        subtitle: "33MP full-frame + 24-70mm lens",
        description: "Sony A7 IV full frame mirrorless camera with 24-70mm f/2.8 G Master lens. Includes two batteries, charger, memory cards and a camera bag. Perfect for capturing the landscapes, glaciers and northern lights of Iceland.",
        price_daily: 8000, price_weekly: 45000, deposit: 300000, cleaning_fee: 1500,
        city: "Reykjavík", lat: 64.1466, lng: -21.9426,
        attributes: { brand: "Sony", model: "A7 IV", resolution: "33 MP", sensor: "Full frame", lens_mount: "Sony E", included_accessories: "2 batteries, SD cards, bag", condition: "like_new" },
        rating: 4.8, review_count: 14, view_count: 460, favorite_count: 27,
        promotion_tier: "platinum", promotion_until: new Date(now.getTime() + 25 * 86400000).toISOString(),
        min_duration_unit: "day", minimum_duration: 1,
        category_attr_needs: "photo", // for demo of conditional fields
      },
      {
        owner: "demo.owner@rento.is", cat: "vehicles", sub: "bikes", slug: "mountain-bike-full-suspension",
        title: "Full suspension mountain bike",
        subtitle: "Great for the gravel roads around Reykjavik",
        description: "Modern full suspension mountain bike in great shape. 29 inch wheels, hydraulic disc brakes, 12 speed. Helmet and lock included.",
        price_hourly: 1200, price_daily: 4500, price_weekly: 25000, deposit: 40000,
        city: "Reykjavík", lat: 64.13, lng: -21.9,
        attributes: { brand: "Scott", model: "Spark", size: "M / 29 inch", weight: "13 kg", condition: "good" },
        rating: 4.5, review_count: 7, view_count: 210, favorite_count: 9,
        min_duration_unit: "hour", minimum_duration: 4,
        pickup_available: true, delivery_available: true,
      },
      {
        owner: "business@rento.is", cat: "vehicles", sub: "trailers", slug: "trailer-750kg-with-cover",
        title: "Trailer 750 kg with cover",
        subtitle: "Great for moves and IKEA runs",
        description: "Solid 750 kg trailer with removable sides and a waterproof cover. Perfect for moving furniture, garden waste or an IKEA run. Lights checked before every rental and a ball hitch is included.",
        price_daily: 6000, price_weekly: 34000, deposit: 35000, cleaning_fee: 2000,
        city: "Kópavogur", lat: 64.1114, lng: -21.8995,
        attributes: { capacity: "750 kg", dimensions: "250 x 150 cm", brakes: false, cover: true, condition: "good" },
        featured: true, featured_until: new Date(now.getTime() + 14 * 86400000).toISOString(),
        promotion_tier: "gold", promotion_until: new Date(now.getTime() + 14 * 86400000).toISOString(),
        rating: 4.8, review_count: 23, view_count: 780, favorite_count: 51,
        min_duration_unit: "day", minimum_duration: 1,
      },
      {
        owner: "demo.owner@rento.is", cat: "vehicles", sub: "bikes", slug: "e-bike-trek-verve-plus-2",
        title: "E-bike - Trek Verve+ 2",
        subtitle: "Comfortable e-bike with 80 km range",
        description: "Comfortable step-through e-bike for the city and coast. Helmets, lock and charger included. Range about 80 km on a full battery. Charged and serviced before every rental.",
        price_hourly: 1300, price_daily: 9500, price_weekly: 55000, deposit: 60000, delivery_fee: 3000, pickup_fee: 1000,
        city: "Reykjavík", lat: 64.13, lng: -21.9,
        attributes: { brand: "Trek", model: "Verve+ 2", frame: "Step-through", range: "80 km", battery: "500 Wh", condition: "like_new" },
        rating: 4.9, review_count: 41, view_count: 890, favorite_count: 63,
        promotion_tier: "gold", promotion_until: new Date(now.getTime() + 10 * 86400000).toISOString(),
        min_duration_unit: "hour", minimum_duration: 4,
        delivery_available: true, pickup_available: true, instant_booking: true,
      },
      {
        owner: "demo.owner@rento.is", cat: "garden", sub: "lawn-mowers", slug: "petrol-lawn-mower",
        title: "Petrol lawn mower",
        subtitle: "Powerful mower for medium and large gardens",
        description: "Powerful petrol lawn mower, perfect for medium and large gardens. Delivered with a full tank and comes with a spare blade. Self-propelled for easy mowing on a slope.",
        price_daily: 5500, price_weekly: 30000, deposit: 30000, cleaning_fee: 1500, pickup_fee: 1000,
        city: "Hafnarfjörður", lat: 64.0671, lng: -21.9377,
        attributes: { brand: "Husqvarna", model: "LC 247S", cutting_width: "47 cm", power: "Petrol, 4-stroke", self_propelled: true, condition: "good" },
        rating: 4.8, review_count: 17, view_count: 320, favorite_count: 14,
        min_duration_unit: "day", minimum_duration: 1,
        pickup_available: true,
      },
      {
        owner: "demo.owner@rento.is", cat: "cleaning", sub: "pressure-washers", slug: "karcher-pressure-washer-k5",
        title: "Kärcher pressure washer K5",
        subtitle: "For car, patio and driveway",
        description: "Kärcher K5 pressure washer. Great for cars, patios, decks and driveways. Multiple nozzles and a patio cleaner included. Ready to go with plug adapter.",
        price_daily: 6000, price_weekly: 32000, deposit: 25000, delivery_fee: 2000,
        city: "Kópavogur", lat: 64.1114, lng: -21.8995,
        attributes: { brand: "Kärcher", model: "K5", pressure: "145 bar", flow: "500 l/h", hose_length: "10 m", condition: "like_new" },
        rating: 4.9, review_count: 27, view_count: 410, favorite_count: 20,
        min_duration_unit: "day", minimum_duration: 1,
        instant_booking: true,
      },
      {
        owner: "demo.owner@rento.is", cat: "office", sub: "laptops", slug: "macbook-pro-14-office",
        title: "MacBook Pro 14\" for work",
        subtitle: "M3, 16 GB RAM - travel-ready workstation",
        description: "MacBook Pro 14 with M3 chip and 16 GB RAM. Perfect for working while travelling Iceland, video calls or photos on the road. Includes charger, sleeve and display cleaning cloth.",
        price_daily: 9000, price_weekly: 48000, deposit: 150000, cleaning_fee: 1000,
        city: "Reykjavík", lat: 64.1466, lng: -21.9426,
        attributes: { brand: "Apple", model: "MacBook Pro 14", chip: "M3", memory: "16 GB", storage: "512 GB SSD", condition: "like_new" },
        rating: 5.0, review_count: 8, view_count: 260, favorite_count: 16,
        promotion_tier: "featured", promotion_until: new Date(now.getTime() + 7 * 86400000).toISOString(),
        min_duration_unit: "day", minimum_duration: 1,
        instant_booking: true,
      },
    ];

    const listingIds = {};
    const LISTING_COLUMNS = [
      "slug", "owner_id", "title", "subtitle", "description",
      "category_id", "subcategory_id", "main_image", "gallery", "status", "verification_status",
      "featured", "featured_until", "promotion_tier", "promotion_until", "currency",
      "price_hourly", "price_daily", "price_weekly", "price_monthly",
      "minimum_duration", "minimum_duration_unit", "deposit_amount",
      "cleaning_fee", "delivery_fee", "pickup_fee", "extra_fee",
      "city", "latitude", "longitude", "airport_name", "airport_distance", "location_public",
      "pickup_available", "delivery_available", "instant_booking", "booking_required",
      "smoking_allowed", "pets_allowed", "min_age", "usage_restrictions", "cancellation_policy",
      "condition", "condition_description", "phone_visibility", "attributes",
      "seo_title", "seo_description",
      "view_count", "unique_view_count", "favorite_count", "rating", "review_count",
    ];

    for (const l of listings) {
      const galleryJson = JSON.stringify([
        `https://picsum.photos/seed/img-${l.slug}-1/900/600`,
        `https://picsum.photos/seed/img-${l.slug}-2/900/600`,
        `https://picsum.photos/seed/img-${l.slug}-3/900/600`,
      ]);
      const values = [
        l.slug, byEmail[l.owner], l.title, l.subtitle, l.description,
        catIds[l.cat], subIds[l.sub], "", galleryJson, "published", "approved",
        l.featured || false, l.featured_until || null, l.promotion_tier || "none", l.promotion_until || null, "ISK",
        l.price_hourly ?? null, l.price_daily ?? null, l.price_weekly ?? null, l.price_monthly ?? null,
        l.minimum_duration ?? 1, l.minimum_duration_unit ?? "day", l.deposit ?? 0,
        l.cleaning_fee ?? 0, l.delivery_fee ?? 0, l.pickup_fee ?? 0, l.extra_fee ?? 0,
        l.city, l.lat ?? null, l.lng ?? null, l.airport_name ?? "", l.airport_distance ?? 0, l.location_public !== false,
        l.pickup_available !== false, l.delivery_available === true, l.instant_booking === true, l.booking_required !== false,
        l.smoking_allowed === true, l.pets_allowed === true, l.min_age ?? 0, l.usage_restrictions ?? "", l.cancellation_policy ?? "moderate",
        l.condition ?? "good", l.condition_description ?? "",
        l.phone_visibility === true, JSON.stringify(l.attributes || {}),
        l.title, l.subtitle,
        l.view_count ?? 0, l.view_count ?? 0, l.favorite_count ?? 0, l.rating ?? 0, l.review_count ?? 0,
      ];
      const placeholders = LISTING_COLUMNS.map((_, i) => `$${i + 1}`).join(",");
      const r = await client.query(
        `INSERT INTO listings (${LISTING_COLUMNS.join(",")})
         VALUES (${placeholders}) RETURNING id, slug`,
        values
      );
      listingIds[l.slug] = r.rows[0].id;

      // gallery images
      const imgs = JSON.parse(galleryJson);
      for (let i = 0; i < imgs.length; i++) {
        await client.query(
          `INSERT INTO listing_images (listing_id, url, sort_order) VALUES ($1,$2,$3)`,
          [r.rows[0].id, imgs[i], i]
        );
      }

      // set main image from first gallery image
      await client.query(
        `UPDATE listings SET main_image = (SELECT url FROM listing_images WHERE listing_id = $1 ORDER BY sort_order LIMIT 1) WHERE id = $1`,
        [r.rows[0].id]
      );
    }

    // ---------- AVAILABILITY ----------
    // Campervan: available all summer, maintenance in early September
    const camperId = listingIds["toyota-hiace-camper-4-berth"];
    const summerStart = future(1, 9).toISOString();
    const summerEnd = new Date();
    summerEnd.setMonth(summerEnd.getMonth() + 2, 1);
    summerEnd.setHours(12, 0, 0, 0);
    await client.query(
      `INSERT INTO availability (listing_id, start_time, end_time, status) VALUES ($1,$2,$3,'available')`,
      [camperId, summerStart, summerEnd.toISOString()]
    );
    await client.query(
      `INSERT INTO availability (listing_id, start_time, end_time, status) VALUES ($1,$2,$3,'maintenance')`,
      [camperId, future(15, 9), new Date(future(15, 9).getTime() + 3 * 86400000).toISOString()]
    );

    // Land Cruiser: blocked a weekend in the near future
    const lcId = listingIds["land-cruiser-4x4-diesel"];
    await client.query(
      `INSERT INTO availability (listing_id, start_time, end_time, status) VALUES ($1,$2,$3,'blocked')`,
      [lcId, future(5, 9), new Date(future(7, 9).getTime()).toISOString()]
    );

    // Demo favorite
    await client.query(
      `INSERT INTO favorites (user_id, listing_id) VALUES ($1,$2)`,
      [byEmail["demo.renter@rento.is"], listingIds["toyota-hiace-camper-4-berth"]]
    );

    await client.query("COMMIT");

    console.log(`Seeded: ${users.rows.length} users, ${cats.length + subs.length} categories, ${locs.length} locations, ${listings.length} listings.`);
    console.log("Demo users (password: password123): demo.owner@rento.is, demo.renter@rento.is, admin@rento.is, business@rento.is");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exitCode = 1;
});