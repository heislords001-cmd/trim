import { getOwnBarberProfile } from "@/actions/barbers";

export default async function DashboardOverviewPage() {
  const barber = await getOwnBarberProfile();
  if (!barber) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="text-sm text-textMuted">Verification</p>
        <p className="mt-1 font-medium">{barber.is_verified ? "Verified" : "Not verified yet"}</p>
      </div>
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="text-sm text-textMuted">Rating</p>
        <p className="mt-1 font-medium">★ {barber.rating_average.toFixed(1)} · {barber.rating_count} reviews</p>
      </div>
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="text-sm text-textMuted">Services listed</p>
        <p className="mt-1 font-medium">{barber.services.length}</p>
      </div>
      {barber.status === "pending" && (
        <p className="text-sm text-textMuted">
          Your profile is awaiting admin approval and won't appear in search results until it's approved.
        </p>
      )}
    </div>
  );
}
