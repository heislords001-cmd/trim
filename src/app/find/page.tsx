import Link from "next/link";
import SearchBar from "@/components/discovery/SearchBar";
import FilterBar from "@/components/discovery/FilterBar";
import DiscoveryResults from "@/components/discovery/DiscoveryResults";
import LocationGate from "@/components/discovery/LocationGate";
import Logo from "@/components/ui/Logo";
import { discoverNearbyBarbers } from "@/actions/barbers";

export default async function FindPage({
  searchParams
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const lat = searchParams.lat ? parseFloat(searchParams.lat) : null;
  const lng = searchParams.lng ? parseFloat(searchParams.lng) : null;

  // No location yet: show the landing gate, not a map. This is the whole
  // point of the gate — nobody sees pins until they've told us where to
  // search, either via geolocation or the city/state -> confirm-pin flow.
  if (lat === null || lng === null) {
    return <LocationGate />;
  }

  const result = await discoverNearbyBarbers({
    lat,
    lng,
    radiusKm: searchParams.radius ? parseFloat(searchParams.radius) : 5,
    sort: (searchParams.sort as "distance" | "rating" | "price") ?? "distance",
    openOnly: searchParams.open === "1",
    verifiedOnly: searchParams.verified === "1"
  });

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/"><Logo /></Link>
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-sm font-medium text-textMuted">Chat</Link>
          <Link href="/join" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accentInk">
            Join as a barber
          </Link>
        </div>
      </header>

      <div className="sticky top-0 z-10 -mx-4 bg-bg/95 px-4 py-3 backdrop-blur">
        <SearchBar />
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <FilterBar />
        <DiscoveryResults
          center={[lat, lng]}
          listings={result.listings}
          locations={result.locations}
          openStatus={result.openStatus}
        />
      </div>
    </main>
  );
}
