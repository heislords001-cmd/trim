import Link from "next/link";
import { getAdminOverview } from "@/actions/admin";

export default async function AdminOverviewPage() {
  const stats = await getAdminOverview();

  const cards = [
    { label: "Total barbers", value: stats.totalBarbers },
    { label: "Pending approval", value: stats.pendingBarbers },
    { label: "Approved", value: stats.approvedBarbers },
    { label: "Suspended", value: stats.suspendedBarbers },
    { label: "Registered customers", value: stats.totalCustomers }
  ];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Admin</h1>
        <Link href="/admin/barbers" className="text-sm text-accent">Manage barbers →</Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-card border border-border bg-surface p-4">
            <p className="text-2xl font-semibold">{card.value}</p>
            <p className="mt-1 text-sm text-textMuted">{card.label}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
