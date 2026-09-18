import { getOwnBarberProfile } from "@/actions/barbers";
import ServicesEditor from "@/components/onboarding/ServicesEditor";

export default async function DashboardServicesPage() {
  const barber = await getOwnBarberProfile();
  if (!barber) return null;

  return (
    <ServicesEditor
      barberId={barber.id}
      initialServices={barber.services.map((s) => ({
        name: s.name,
        priceNaira: s.price_naira,
        durationMinutes: s.duration_minutes
      }))}
    />
  );
}
