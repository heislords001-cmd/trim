"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

// Drives the three ways a customer can give us a location:
// browser geolocation, typing a place, or (later) dropping a pin on the map.
export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location access.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", position.coords.latitude.toString());
        params.set("lng", position.coords.longitude.toString());
        params.delete("q");
        router.push(`/find?${params.toString()}`);
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location. Try searching by city instead.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // Free-text city/area search: geocode via your provider of choice
  // (Mapbox Geocoding, Google Places, or OpenStreetMap Nominatim) in
  // a server action, then push the resulting lat/lng the same way
  // useMyLocation does. Stubbed here so the UI is wired end to end.
  async function searchByText(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setError("Text search needs a geocoding provider — see the TODO in SearchBar.tsx.");
  }

  return (
    <div className="w-full">
      <form onSubmit={searchByText} className="flex items-center gap-2 rounded-card bg-surface border border-border px-4 py-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-textMuted">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a city or area"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-textMuted"
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="text-sm font-medium text-accent whitespace-nowrap hover:opacity-80"
        >
          {locating ? "Locating…" : "Use my location"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-gold">{error}</p>}
    </div>
  );
}
