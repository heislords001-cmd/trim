"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import BarberCard from "./BarberCard";
import type { DiscoveryListing } from "@/lib/types/database.types";

// Leaflet touches `window`, so the map can only render on the client.
const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function DiscoveryResults({
  center,
  listings,
  locations,
  openStatus
}: {
  center: [number, number];
  listings: DiscoveryListing[];
  locations: Record<string, [number, number]>;
  openStatus: Record<string, boolean>;
}) {
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="inline-flex rounded-full border border-border bg-surface p-1 text-sm">
          <button
            onClick={() => setView("list")}
            className={`rounded-full px-3 py-1 ${view === "list" ? "bg-accent text-accentInk" : "text-textMuted"}`}
          >
            List
          </button>
          <button
            onClick={() => setView("map")}
            className={`rounded-full px-3 py-1 ${view === "map" ? "bg-accent text-accentInk" : "text-textMuted"}`}
          >
            Map
          </button>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-8 text-center">
          <p className="text-textPrimary">No barbers found nearby.</p>
          <p className="mt-1 text-sm text-textMuted">Try expanding your search radius from the filters above.</p>
        </div>
      ) : view === "list" ? (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <BarberCard key={`${listing.source}-${listing.id}`} listing={listing} isOpen={openStatus[listing.id] ?? false} />
          ))}
        </div>
      ) : (
        <MapView center={center} listings={listings} locations={locations} />
      )}
    </div>
  );
}
