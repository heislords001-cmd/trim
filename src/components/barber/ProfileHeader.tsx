import Image from "next/image";
import { formatDistance } from "@/lib/utils/format";

export default function ProfileHeader({
  name,
  logoUrl,
  verified,
  rating,
  reviewCount,
  distanceMeters
}: {
  name: string;
  logoUrl: string | null;
  verified: boolean;
  rating: number;
  reviewCount: number;
  distanceMeters?: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-surfaceMuted">
        {logoUrl ? (
          <Image src={logoUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">💈</div>
        )}
      </div>
      <div>
        <h1 className="text-xl font-semibold">{name}</h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-textMuted">
          <span className="text-gold">★</span>
          <span className="text-textPrimary">{rating.toFixed(1)}</span>
          <span>· {reviewCount} reviews</span>
          {verified && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">Verified</span>}
        </div>
        {typeof distanceMeters === "number" && (
          <p className="mt-1 text-sm text-textMuted">{formatDistance(distanceMeters)}</p>
        )}
      </div>
    </div>
  );
}
