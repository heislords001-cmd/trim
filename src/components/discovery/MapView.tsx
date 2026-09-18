"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import Link from "next/link";
import type { DiscoveryListing } from "@/lib/types/database.types";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Slightly muted/greyscale so unclaimed listings read as secondary next to
// registered barbers on the map, without needing a second icon asset.
const externalMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  className: "opacity-60 grayscale"
});

function RecenterOnChange({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function MapView({
  center,
  listings,
  locations
}: {
  center: [number, number];
  listings: DiscoveryListing[];
  locations: Record<string, [number, number]>;
}) {
  return (
    <div className="h-[420px] w-full overflow-hidden rounded-card border border-border">
      <MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnChange center={center} />
        <Marker position={center} icon={markerIcon}>
          <Popup>You are here</Popup>
        </Marker>
        {listings.map((listing) => {
          const position = locations[listing.id];
          if (!position) return null;
          return (
            <Marker
              key={`${listing.source}-${listing.id}`}
              position={position}
              icon={listing.source === "platform" ? markerIcon : externalMarkerIcon}
            >
              <Popup>
                {listing.source === "platform" ? (
                  <>
                    <Link href={`/barbers/${listing.slug}`} className="font-medium">
                      {listing.name}
                    </Link>
                    <div>★ {listing.ratingAverage?.toFixed(1)}</div>
                  </>
                ) : (
                  <>
                    <div className="font-medium">{listing.name}</div>
                    <div className="text-xs text-gray-500">Unclaimed listing</div>
                  </>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
