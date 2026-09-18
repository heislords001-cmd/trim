"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";

const LocationPicker = dynamic(() => import("@/components/onboarding/LocationPicker"), { ssr: false });

// Shown on first visit instead of the map. Nobody sees a map full of pins
// until they've actually given a location — either instantly via device
// geolocation, or by typing a city/state and then fine-tuning a pin on a
// small confirm-map (the "mini map" step) before we run the real search.
export default function LocationGate() {
  const router = useRouter();
  const [mode, setMode] = useState<"landing" | "confirm">("landing");
  const [country, setCountry] = useState("Nigeria");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number }>({ lat: 9.0765, lng: 7.3986 }); // Abuja default
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useMyLocation() {
    if (!navigator.geolocation) return setError("Your browser doesn't support location access.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        router.push(`/?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location — try entering your city instead.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function goToConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return setError("Add a city to continue.");
    setError(null);
    // TODO: geocode {city, stateRegion, country} to a real lat/lng here
    // (Mapbox/Google/Nominatim) and use it as the pin's starting point
    // instead of the fixed default — the pin below just needs *a* point
    // to start from since the person adjusts it by hand next.
    setMode("confirm");
  }

  function searchThisArea() {
    const params = new URLSearchParams({ lat: String(pin.lat), lng: String(pin.lng), q: city });
    router.push(`/?${params.toString()}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <div className="mb-10 text-center">
        <Logo size="text-3xl" />
        <h1 className="mt-4 text-xl font-semibold">Find a barber near you</h1>
        <p className="mt-1 text-sm text-textMuted">Verified barbers and barbershops, sorted by distance.</p>
      </div>

      {mode === "landing" ? (
        <form onSubmit={goToConfirm} className="flex flex-col gap-3">
          <input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} className="input" />
          <input placeholder="State / region" value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} className="input" />
          <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="input" />
          {error && <p className="text-sm text-accent">{error}</p>}
          <button type="submit" className="btn-primary">Continue</button>
          <div className="my-1 flex items-center gap-3 text-xs text-textMuted">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <button type="button" onClick={useMyLocation} disabled={locating} className="rounded-full border border-border py-3 text-sm font-medium">
            {locating ? "Locating…" : "Use my current location"}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-textMuted">
            Drop the pin on {city}
            {stateRegion ? `, ${stateRegion}` : ""} so we search the right spot.
          </p>
          <LocationPicker lat={pin.lat} lng={pin.lng} onChange={(lat, lng) => setPin({ lat, lng })} />
          <button onClick={searchThisArea} className="btn-primary">Search this area</button>
          <button onClick={() => setMode("landing")} className="text-sm text-textMuted">← Back</button>
        </div>
      )}
    </main>
  );
}
