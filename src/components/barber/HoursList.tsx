import { dayLabel, formatTime } from "@/lib/utils/format";

export default function HoursList({
  hours
}: {
  hours: { day_of_week: number; is_open: boolean; open_time: string | null; close_time: string | null }[];
}) {
  const byDay = new Map(hours.map((h) => [h.day_of_week, h]));
  return (
    <ul className="rounded-card border border-border bg-surface divide-y divide-border">
      {Array.from({ length: 7 }, (_, day) => {
        const entry = byDay.get(day);
        return (
          <li key={day} className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="text-textMuted">{dayLabel(day)}</span>
            <span className="text-textPrimary">
              {entry?.is_open && entry.open_time && entry.close_time
                ? `${formatTime(entry.open_time)} – ${formatTime(entry.close_time)}`
                : "Closed"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
