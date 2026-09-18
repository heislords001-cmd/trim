import { getOwnBarberProfile } from "@/actions/barbers";
import HoursEditor from "@/components/onboarding/HoursEditor";

export default async function DashboardHoursPage() {
  const barber = await getOwnBarberProfile();
  if (!barber) return null;

  const byDay = new Map(barber.hours.map((h) => [h.day_of_week, h]));
  const initialHours = Array.from({ length: 7 }, (_, day) => {
    const existing = byDay.get(day);
    return {
      dayOfWeek: day,
      isOpen: existing?.is_open ?? day !== 0,
      openTime: existing?.open_time ?? "09:00",
      closeTime: existing?.close_time ?? "20:00"
    };
  });

  return <HoursEditor barberId={barber.id} initialHours={initialHours} />;
}
