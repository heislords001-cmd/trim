import { formatNaira } from "@/lib/utils/format";

export default function ServicesList({
  services
}: {
  services: { id: string; name: string; price_naira: number; duration_minutes: number | null }[];
}) {
  if (services.length === 0) {
    return <p className="text-sm text-textMuted">No services listed yet.</p>;
  }
  return (
    <ul className="divide-y divide-border rounded-card border border-border bg-surface">
      {services.map((service) => (
        <li key={service.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium text-textPrimary">{service.name}</p>
            {service.duration_minutes && (
              <p className="text-xs text-textMuted">{service.duration_minutes} minutes</p>
            )}
          </div>
          <span className="text-sm font-medium text-textPrimary">
            ₦{service.price_naira.toLocaleString("en-NG")}
          </span>
        </li>
      ))}
    </ul>
  );
}
