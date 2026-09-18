import { createClient } from "@/lib/supabase/server";
import { isOpenNow } from "@/lib/utils/format";
import type { NearbyBarberRow, NearbyExternalListingRow, DiscoveryListing, BusinessHour } from "@/lib/types/database.types";

export interface DiscoverParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  sort?: "distance" | "rating" | "price";
  openOnly?: boolean;
  verifiedOnly?: boolean;
}

export interface DiscoverResult {
  listings: DiscoveryListing[];
  locations: Record<string, [number, number]>;
  openStatus: Record<string, boolean>;
}

// Server-side data loader for the discovery page. Runs two Postgres geo
// searches in parallel — nearby_barbers() for registered accounts and
// nearby_external_listings() for unclaimed shops sourced from OSM/Places
// (see scripts/sync-external-listings.ts) — then merges them into one
// list. This is the piece that keeps the app useful in areas with few
// or no registered barbers yet, instead of being empty there.
export async function discoverNearbyBarbers({
  lat,
  lng,
  radiusKm = 5,
  sort = "distance",
  openOnly = false,
  verifiedOnly = false
}: DiscoverParams): Promise<DiscoverResult> {
  const supabase = createClient();

  const [{ data: nearbyBarbers, error: barberError }, { data: nearbyExternal, error: externalError }] = await Promise.all([
    supabase.rpc("nearby_barbers", { search_lat: lat, search_lng: lng, radius_km: radiusKm, max_results: 100 }),
    supabase.rpc("nearby_external_listings", { search_lat: lat, search_lng: lng, radius_km: radiusKm, max_results: 100 })
  ]);

  if (barberError) throw barberError;
  // External listings are a "nice to have" enrichment — if that RPC/table
  // isn't set up yet, fall back to platform-only results rather than
  // failing the whole search.
  const externalRows = externalError ? [] : ((nearbyExternal ?? []) as NearbyExternalListingRow[]);
  const barberRows = (nearbyBarbers ?? []) as NearbyBarberRow[];
  const ids = barberRows.map((b) => b.barber_id);

  const [{ data: hoursRows }, { data: locationRows }] = await Promise.all([
    ids.length
      ? supabase.from("business_hours").select("*").in("barber_id", ids)
      : Promise.resolve({ data: [] as BusinessHour[] }),
    ids.length
      ? supabase.from("business_locations").select("barber_id, geog").in("barber_id", ids)
      : Promise.resolve({ data: [] as { barber_id: string; geog: any }[] })
  ]);

  const hoursByBarber = new Map<string, BusinessHour[]>();
  (hoursRows ?? []).forEach((row) => {
    const list = hoursByBarber.get(row.barber_id) ?? [];
    list.push(row);
    hoursByBarber.set(row.barber_id, list);
  });

  const openStatus: Record<string, boolean> = {};
  ids.forEach((id) => {
    openStatus[id] = isOpenNow(hoursByBarber.get(id) ?? []);
  });

  const locations: Record<string, [number, number]> = {};
  (locationRows ?? []).forEach((row: any) => {
    const [lngCoord, latCoord] = row.geog.coordinates;
    locations[row.barber_id] = [latCoord, lngCoord];
  });
  externalRows.forEach((e) => {
    locations[e.listing_id] = [e.lat, e.lng];
  });

  let listings: DiscoveryListing[] = [
    ...barberRows.map(
      (b): DiscoveryListing => ({
        id: b.barber_id,
        source: "platform",
        name: b.business_name,
        slug: b.slug,
        logoUrl: b.logo_url,
        ratingAverage: b.rating_average,
        ratingCount: b.rating_count,
        isVerified: b.is_verified,
        address: b.address,
        city: b.city,
        distanceMeters: b.distance_meters,
        startingPrice: b.starting_price
      })
    ),
    ...externalRows.map(
      (e): DiscoveryListing => ({
        id: e.listing_id,
        source: "external",
        name: e.name,
        slug: null,
        logoUrl: null,
        ratingAverage: null,
        ratingCount: null,
        isVerified: false,
        address: e.address,
        city: e.city,
        distanceMeters: e.distance_meters,
        startingPrice: null
      })
    )
  ];

  if (verifiedOnly) listings = listings.filter((l) => l.isVerified);
  if (openOnly) listings = listings.filter((l) => l.source === "platform" && openStatus[l.id]);

  if (sort === "rating") {
    listings = [...listings].sort((a, b) => (b.ratingAverage ?? -1) - (a.ratingAverage ?? -1));
  } else if (sort === "price") {
    listings = [...listings].sort((a, b) => (a.startingPrice ?? Infinity) - (b.startingPrice ?? Infinity));
  } else {
    listings = [...listings].sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  return { listings, locations, openStatus };
}

export interface BarberProfileDetail {
  id: string;
  business_name: string;
  slug: string;
  description: string | null;
  business_phone: string | null;
  whatsapp_number: string | null;
  logo_url: string | null;
  is_verified: boolean;
  rating_average: number;
  rating_count: number;
  location: { address: string; city: string; state_region: string | null; country: string; lat: number; lng: number } | null;
  services: { id: string; name: string; price_naira: number; duration_minutes: number | null }[];
  hours: { day_of_week: number; is_open: boolean; open_time: string | null; close_time: string | null }[];
  images: { id: string; image_url: string; image_type: string }[];
}

// Loads everything the public profile page needs in one round trip.
// Only returns approved barbers to anonymous visitors — the owner and
// admins can still preview a pending profile because of the RLS policy
// on barber_profiles (status = 'approved' OR owner_id = auth.uid() OR is_admin()).
export async function getBarberBySlug(slug: string): Promise<BarberProfileDetail | null> {
  const supabase = createClient();

  const { data: barber, error } = await supabase
    .from("barber_profiles")
    .select("id, business_name, slug, description, business_phone, whatsapp_number, logo_url, is_verified, rating_average, rating_count")
    .eq("slug", slug)
    .single();

  if (error || !barber) return null;

  const [{ data: location }, { data: services }, { data: hours }, { data: images }] = await Promise.all([
    supabase.from("business_locations").select("address, city, state_region, country, geog").eq("barber_id", barber.id).maybeSingle(),
    supabase.from("services").select("id, name, price_naira, duration_minutes").eq("barber_id", barber.id).order("sort_order"),
    supabase.from("business_hours").select("day_of_week, is_open, open_time, close_time").eq("barber_id", barber.id).order("day_of_week"),
    supabase.from("barber_images").select("id, image_url, image_type").eq("barber_id", barber.id).order("sort_order")
  ]);

  return {
    ...barber,
    location: location
      ? {
          address: location.address,
          city: location.city,
          state_region: location.state_region,
          country: location.country,
          lng: (location.geog as any).coordinates[0],
          lat: (location.geog as any).coordinates[1]
        }
      : null,
    services: services ?? [],
    hours: hours ?? [],
    images: images ?? []
  };
}

// Used by the barber dashboard: loads the signed-in user's own barber
// business (there's one owner_id -> one barber_profiles row today; the
// `.limit(1)` is there so this still works if that's ever relaxed to
// one owner managing several locations).
export async function getOwnBarberProfile() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: barber } = await supabase
    .from("barber_profiles")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!barber) return null;
  return getBarberBySlug(barber.slug).then((detail) => ({ ...detail!, status: barber.status }));
}
