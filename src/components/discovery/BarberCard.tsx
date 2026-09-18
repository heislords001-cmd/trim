import Link from "next/link";
import Image from "next/image";
import { formatDistance, formatNaira } from "@/lib/utils/format";
import type { DiscoveryListing } from "@/lib/types/database.types";

export default function BarberCard({
  listing,
  isOpen
}: {
  listing: DiscoveryListing;
  isOpen: boolean;
}) {
  const body = (
    <div className="flex gap-4 rounded-card border border-border bg-surface p-3">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-surfaceMuted">
        {listing.logoUrl ? (
          <Image src={listing.logoUrl} alt={listing.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl">💈</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-display font-semibold text-textPrimary">{listing.name}</h3>
          {listing.isVerified && (
            <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
              Verified
            </span>
          )}
        </div>

        {listing.source === "platform" ? (
          <>
            <div className="mt-1 flex items-center gap-1 text-sm text-textMuted">
              <span className="text-gold">★</span>
              <span className="text-textPrimary">{listing.ratingAverage?.toFixed(1)}</span>
              <span>({listing.ratingCount})</span>
              <span>·</span>
              <span>{formatDistance(listing.distanceMeters)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="text-textPrimary">{formatNaira(listing.startingPrice)}</span>
              <span className="text-textMuted">·</span>
              <span className={isOpen ? "text-emerald-500" : "text-textMuted"}>{isOpen ? "Open now" : "Closed"}</span>
            </div>
          </>
        ) : (
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="rounded-full bg-surfaceMuted px-2 py-0.5 text-xs font-medium text-textMuted">Unclaimed</span>
            <span className="text-textMuted">{formatDistance(listing.distanceMeters)}</span>
          </div>
        )}

        <p className="mt-1 truncate text-xs text-textMuted">{listing.city}</p>
      </div>
    </div>
  );

  // Only registered barbers have a real profile/services/chat to link to —
  // an unclaimed listing is informational only, with a nudge to claim it.
  if (listing.source === "external") {
    return (
      <div className="flex flex-col gap-1">
        {body}
        <Link href={`/join?claim=${listing.id}`} className="ml-1 text-xs text-accent">
          Is this your shop? Claim it →
        </Link>
      </div>
    );
  }

  return <Link href={`/barbers/${listing.slug}`}>{body}</Link>;
}
