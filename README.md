# Barber Marketplace — starter

Real architecture, not a demo: Next.js 14 (App Router) + Supabase (Postgres,
PostGIS, Auth, Storage, RLS). No hardcoded barber data anywhere in the app —
every result on the discovery page comes from `nearby_barbers()`, a Postgres
function that does the geo search server-side so it scales past a few
hundred rows without dragging the whole table to the client.

## What's here vs. what you still need to add

Working end to end:
- Schema + PostGIS geo search + RLS (`supabase/*.sql`)
- Auth (Supabase Auth, role stored on `profiles`, trigger auto-creates the row)
- Location-gated home: no map on arrival — pick "use my location" or enter
  city/state, confirm on a small pin-drop map, *then* the real map+list
  search loads (`components/discovery/LocationGate.tsx`)
- Customer discovery: list/map (Leaflet + OpenStreetMap, no API key needed), filters, distance/rating/price sort, open-now filter
- Hybrid results: registered barbers **and** unclaimed listings pulled from
  OpenStreetMap (`external_listings` table + `nearby_external_listings()`,
  seeded by `scripts/sync-external-listings.ts`) so search isn't limited to
  who's signed up yet — unclaimed shops show a "Claim it" link into `/join`
- Public barber profile page, with a **Message** button that opens a real chat thread
- Chat: `conversations` + `messages` tables, RLS scoped to participants, Supabase
  Realtime for live updates (`/chat` for customers, `/dashboard/chat` for barbers,
  same components underneath)
- 7-step barber onboarding wizard, writing real rows at every step
- Barber dashboard (services / hours / photos / chat)
- Admin dashboard (stats + approve/reject/suspend)
- Floating light/dark theme toggle (`components/ui/ThemeToggle.tsx`), oxblood/ink/gold palette via CSS variables
- Route protection middleware + defense-in-depth RLS

Intentionally stubbed, with a comment at the spot to fill in:
- **City/area text search** (`LocationGate.tsx`) — the confirm-pin map works with no key today; wire in a geocoder (Mapbox/Google/Nominatim) to pre-position that pin instead of the fixed default.
- **Booking flow** — the button is there on the barber profile page and the
  `bookings` table exists, but the actual scheduling UI isn't built. That's
  the next thing to build on this foundation.
- **Reviews UI** — table + rating aggregation trigger exist; no write UI yet.
- **External listings ingestion** — `scripts/sync-external-listings.ts` pulls
  from OSM Overpass for free; run it manually or put it on a schedule. Swap
  in Google Places if you want richer data and don't mind the cost.

## Setup

1. Create a Supabase project.
2. In the SQL editor, run in order:
   `supabase/schema.sql` → `supabase/functions.sql` → `supabase/policies.sql`
3. In Project Settings → API, copy your URL/keys into `.env.local` (from `.env.example`).
4. `npm install`
5. `npm run dev`
6. (Optional) seed unclaimed listings for your area:
   `npx tsx scripts/sync-external-listings.ts --lat 9.0765 --lng 7.3986 --radius 15`

To promote your own account to admin after signing up once:

```sql
update public.profiles set role = 'admin' where id = 'your-user-id';
```

## Why PostGIS instead of Haversine-in-JS

`business_locations.geog` is a `geography(Point, 4326)` column with a GiST
index. `nearby_barbers()` uses `ST_DWithin` (index-accelerated radius filter)
and `ST_Distance` for sorting, all inside one query. That's the difference
between an index seek and a full table scan as the barber count grows — it's
the piece of this spec that's easy to get wrong by calculating distance in
the frontend against every row.

## Project layout

```
supabase/           schema.sql, functions.sql (RPCs), policies.sql (RLS)
src/lib/supabase/   browser / server / middleware Supabase clients
src/lib/types/      hand-written DB types (regenerate via `npm run supabase:types`)
src/actions/        server-side data loaders + server actions (the real API layer)
src/components/     discovery, barber profile, onboarding, admin UI
src/app/            routes — home, /barbers/[slug], /join, /dashboard/*, /admin/*
```
