# Rento — Iceland Rental Marketplace

Peer-to-peer rental marketplace for items, vehicles and gear in Iceland.

## Stack
- **Backend**: Node.js 20 + Express + PostgreSQL 16 (Docker), JWT auth, zod validation.
- **Web app**: React + Vite SPA in `web/`.
- **Mobile app**: Flutter source in `mobile/` (requires Flutter SDK to build).
- **Tests**: `backend/test/integration.js` — 25 end-to-end API tests.

## Quick start

### 1. Database (Docker)
```bash
docker compose up -d
```
PostgreSQL 16 on `localhost:5432` (`rento` / `rento_dev`).

### 2. Backend
```bash
cd backend
npm install
npm run db:reset   # create schema + seed demo data
npm start          # API on http://localhost:4000
```

Demo users (password `password123`):
- `demo.renter@rento.is` — renter
- `demo.owner@rento.is` — owner
- `business@rento.is` — business owner (owns the demo campervan)
- `admin@rento.is` — admin

### 3. Web app
```bash
cd web
npm install
npm run dev        # http://localhost:5173 (proxies /api + /uploads to :4000)
```

### 4. Mobile app (Flutter)
```bash
cd mobile
flutter create .   # generate android/ios platform folders
flutter pub get
flutter run
```
Set the API base with `--dart-define=API_BASE=http://<your-ip>:4000/api` when running on a device.

## Useful commands
```bash
cd backend
npm test                 # integration suite (seeds first)
npm run db:seed          # reset data without schema
curl http://localhost:4000/health
```

## Feature map (MVP Phase 1 + 2)
- Auth: register/login/JWT + Google OAuth, renter+owner profiles.
- Listings: category-specific attributes, photo upload, pricing (hourly/daily/weekly), fees + deposit, availability windows & blocks.
- Search: keyword, category/subcategory, location, date-range availability, price/sort filters, facets.
- Booking lifecycle: request → approve → pay (mock) → pickup → return → complete; reviews after completion.
- Favorites, messaging (conversations + unread counts), notifications, dashboard (owner + renter), calendar.
- Later phases: real payments (Stripe), reviews revamp, moderation/verification workflows.

## Google login (optional)
1. Go to https://console.cloud.google.com → create a project → **APIs & Services → OAuth consent screen** (External, add yourself as test user).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
   - Authorized redirect URI: `http://localhost:4000/api/auth/google/callback`
3. Paste into `backend/.env`:
   ```bash
   GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxx
   ```
4. Restart the backend. The "Continue with Google" button appears on the login/register pages.
- New users are auto-created on first sign-in (email verified). Existing accounts log in automatically.