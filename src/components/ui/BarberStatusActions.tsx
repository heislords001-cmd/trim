"use client";

import { useState } from "react";
import { setBarberStatus } from "@/actions/onboarding";

export default function BarberStatusActions({ barberId, status }: { barberId: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [busy, setBusy] = useState(false);

  async function apply(next: "approved" | "rejected" | "suspended") {
    setBusy(true);
    const result = await setBarberStatus(barberId, next);
    setBusy(false);
    if (result.ok) setCurrent(next);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-textMuted">{current}</span>
      {current !== "approved" && (
        <button disabled={busy} onClick={() => apply("approved")} className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
          Approve
        </button>
      )}
      {current !== "rejected" && (
        <button disabled={busy} onClick={() => apply("rejected")} className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-400">
          Reject
        </button>
      )}
      {current === "approved" && (
        <button disabled={busy} onClick={() => apply("suspended")} className="rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">
          Suspend
        </button>
      )}
    </div>
  );
}
