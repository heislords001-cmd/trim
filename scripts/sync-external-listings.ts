/**
 * Seeds public.external_listings from OpenStreetMap (Overpass API — free,
 * no key required) so search isn't empty in areas with no registered
 * barbers yet. Run manually or on a schedule (cron / Supabase Edge
 * Function / GitHub Action):
 *
 *   npx tsx scripts/sync-external-listings.ts --lat 9.0765 --lng 7.3986 --radius 15
 *
 * Swap the Overpass query for a Google Places Nearby Search call if you'd
 * rather pay for richer data (photos, ratings) — same upsert shape below.
 */
import { createClient } from "@supabase/supabase-js";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg, i, all) => (arg.startsWith("--") ? [arg.slice(2), all[i + 1]] : []))
) as Record<string, string>;

const lat = parseFloat(args.lat ?? "9.0765");
const lng = parseFloat(args.lng ?? "7.3986");
const radiusKm = parseFloat(args.radius ?? "15");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const query = `
    [out:json][timeout:25];
    (
      node["shop"="hairdresser"](around:${radiusKm * 1000},${lat},${lng});
      node["shop"="barber"](around:${radiusKm * 1000},${lat},${lng});
    );
    out body;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query
  });
  const { elements } = (await response.json()) as {
    elements: { id: number; lat: number; lon: number; tags?: Record<string, string> }[];
  };

  const rows = elements.map((el) => ({
    source: "osm",
    external_id: String(el.id),
    name: el.tags?.name ?? "Unnamed barbershop",
    address: el.tags?.["addr:street"]
      ? `${el.tags["addr:housenumber"] ?? ""} ${el.tags["addr:street"]}`.trim()
      : null,
    city: el.tags?.["addr:city"] ?? null,
    country: el.tags?.["addr:country"] ?? null,
    geog: `SRID=4326;POINT(${el.lon} ${el.lat})`,
    raw_tags: el.tags ?? {}
  }));

  if (rows.length === 0) {
    console.log("No OSM barbershops found in that radius.");
    return;
  }

  const { error, count } = await supabase
    .from("external_listings")
    .upsert(rows, { onConflict: "source,external_id", count: "exact" });

  if (error) throw error;
  console.log(`Upserted ${count ?? rows.length} external listings.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
