import Link from "next/link";
import { listBarbersForAdmin } from "@/actions/admin";
import BarberStatusActions from "@/components/ui/BarberStatusActions";

export default async function AdminBarbersPage({
  searchParams
}: {
  searchParams: { status?: string };
}) {
  const barbers = await listBarbersForAdmin(searchParams.status);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Barbers</h1>
        <Link href="/admin" className="text-sm text-textMuted">← Overview</Link>
      </div>

      <div className="mb-4 flex gap-2 text-sm">
        {["", "pending", "approved", "rejected", "suspended"].map((status) => (
          <Link
            key={status || "all"}
            href={status ? `/admin/barbers?status=${status}` : "/admin/barbers"}
            className={`rounded-full border px-3 py-1 ${
              (searchParams.status ?? "") === status ? "border-accent text-accent" : "border-border text-textMuted"
            }`}
          >
            {status || "All"}
          </Link>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {barbers.map((barber) => (
          <li key={barber.id} className="flex items-center justify-between rounded-card border border-border bg-surface p-4">
            <div>
              <a href={`/barbers/${barber.slug}`} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                {barber.business_name}
              </a>
              <p className="text-xs text-textMuted">{barber.city ?? "No location saved"}</p>
            </div>
            <BarberStatusActions barberId={barber.id} status={barber.status} />
          </li>
        ))}
        {barbers.length === 0 && <p className="text-sm text-textMuted">No barbers in this category.</p>}
      </ul>
    </main>
  );
}
