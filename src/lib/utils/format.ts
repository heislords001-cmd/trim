import type { BusinessHour } from "@/lib/types/database.types";

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}

export function formatNaira(amount: number | null): string {
  if (amount === null) return "Price on request";
  return `From ₦${amount.toLocaleString("en-NG")}`;
}

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export function dayLabel(dayOfWeek: number): string {
  return DAY_LABELS[dayOfWeek] ?? "";
}

export function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

// Determines open/closed "now" from a barber's business_hours rows.
// Runs on the server (page render) using server clock time; for a
// production app also pass the barber's timezone/UTC offset explicitly
// rather than relying on the server's local time.
export function isOpenNow(hours: BusinessHour[], now: Date = new Date()): boolean {
  const today = hours.find((h) => h.day_of_week === now.getDay());
  if (!today || !today.is_open || !today.open_time || !today.close_time) return false;

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = today.open_time.split(":").map(Number);
  const [closeH, closeM] = today.close_time.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return minutesNow >= openMinutes && minutesNow < closeMinutes;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
