"use client";

import { useState } from "react";
import { saveBarberServices } from "@/actions/onboarding";

type ServiceDraft = { name: string; priceNaira: number; durationMinutes: number | null };

export default function ServicesEditor({
  barberId,
  initialServices
}: {
  barberId: string;
  initialServices: ServiceDraft[];
}) {
  const [services, setServices] = useState<ServiceDraft[]>(initialServices);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handleSave() {
    setSaving(true);
    const result = await saveBarberServices(barberId, services);
    setSaving(false);
    if (result.ok) setSavedAt(Date.now());
  }

  return (
    <div className="flex flex-col gap-3">
      {services.map((service, i) => (
        <div key={i} className="flex gap-2">
          <input
            placeholder="Service name"
            value={service.name}
            onChange={(e) => setServices((s) => s.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row)))}
            className="input flex-1"
          />
          <input
            type="number"
            placeholder="₦ Price"
            value={service.priceNaira}
            onChange={(e) => setServices((s) => s.map((row, idx) => (idx === i ? { ...row, priceNaira: Number(e.target.value) } : row)))}
            className="input w-28"
          />
          <button onClick={() => setServices((s) => s.filter((_, idx) => idx !== i))} className="px-2 text-textMuted">✕</button>
        </div>
      ))}
      <button
        onClick={() => setServices((s) => [...s, { name: "", priceNaira: 0, durationMinutes: 30 }])}
        className="rounded-lg border border-dashed border-border py-2 text-sm text-textMuted"
      >
        + Add service
      </button>
      <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save changes"}</button>
      {savedAt && <p className="text-xs text-emerald-400">Saved.</p>}
    </div>
  );
}
