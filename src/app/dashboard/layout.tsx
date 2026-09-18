import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnBarberProfile } from "@/actions/barbers";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/services", label: "Services" },
  { href: "/dashboard/hours", label: "Hours" },
  { href: "/dashboard/photos", label: "Photos" },
  { href: "/dashboard/chat", label: "Chat" }
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const barber = await getOwnBarberProfile();
  // middleware.ts already gates /dashboard/* to role=barber|admin; this
  // covers the case where a barber account exists but hasn't finished /join.
  if (!barber) redirect("/join");

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{barber.business_name}</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            barber.status === "approved"
              ? "bg-emerald-500/15 text-emerald-400"
              : barber.status === "pending"
              ? "bg-gold/15 text-gold"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {barber.status}
        </span>
      </div>
      <nav className="mb-8 flex gap-4 border-b border-border text-sm">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="pb-3 text-textMuted hover:text-textPrimary">
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
