"use client";

import { useState } from "react";
import { dayLabel } from "@/lib/utils/format";
import { saveBarberHours } from "@/actions/onboarding";

type HourDraft = { dayOfWeek: number; isOpen: boolean; openTime: string | null; closeTime: string | null };

export default function HoursEditor({ barberId, initialHours }: { barberId: string; initialHours: HourDraft[] }) {
  const [hours, setHours] = useState<HourDraft[]>(initialHours);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handleSave() {
    setSaving(true);
    const result = await saveBarberHours(barberId, hours);
    setSaving(false);
    if (result.ok) setSavedAt(Date.now());
  }

  return (
    <div className="flex flex-col gap-2">
      {hours.map((h, i) => (
        <div key={h.dayOfWeek} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <span className="w-24 text-sm">{dayLabel(h.dayOfWeek)}</span>
          <label className="flex items-center gap-1 text-xs text-textMuted">
            <input
              type="checkbox"
              checked={h.isOpen}
              onChange={(e) => setHours((prev) => prev.map((row, idx) => (idx === i ? { ...row, isOpen: e.target.checked } : row)))}
            />
            Open
          </label>
          {h.isOpen && (
            <>
              <input type="time" value={h.openTime ?? ""} onChange={(e) => setHours((prev) => prev.map((row, idx) => (idx === i ? { ...row, openTime: e.target.value } : row)))} className="input flex-1 py-1" />
              <input type="time" value={h.closeTime ?? ""} onChange={(e) => setHours((prev) => prev.map((row, idx) => (idx === i ? { ...row, closeTime: e.target.value } : row)))} className="input flex-1 py-1" />
            </>
          )}
        </div>
      ))}
      <button onClick={handleSave} disabled={saving} className="btn-primary mt-2">{saving ? "Saving…" : "Save changes"}</button>
      {savedAt && <p className="text-xs text-emerald-400">Saved.</p>}
    </div>
  );
}
