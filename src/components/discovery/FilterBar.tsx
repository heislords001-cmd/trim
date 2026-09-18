"use client";

import { useRouter, useSearchParams } from "next/navigation";

const RADIUS_OPTIONS = [1, 2, 5, 10, 20];
const SORT_OPTIONS = [
  { value: "distance", label: "Nearest" },
  { value: "rating", label: "Top rated" },
  { value: "price", label: "Lowest price" }
];

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/?${params.toString()}`);
  }

  const radius = searchParams.get("radius") ?? "5";
  const sort = searchParams.get("sort") ?? "distance";
  const openNow = searchParams.get("open") === "1";
  const verifiedOnly = searchParams.get("verified") === "1";

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <select
        value={radius}
        onChange={(e) => setParam("radius", e.target.value)}
        className="rounded-full border border-border bg-surface px-3 py-1.5 text-textPrimary"
      >
        {RADIUS_OPTIONS.map((km) => (
          <option key={km} value={km}>
            Within {km} km
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(e) => setParam("sort", e.target.value)}
        className="rounded-full border border-border bg-surface px-3 py-1.5 text-textPrimary"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        onClick={() => setParam("open", openNow ? "0" : "1")}
        className={`rounded-full border px-3 py-1.5 ${
          openNow ? "border-accent bg-accent/15 text-accent" : "border-border bg-surface text-textPrimary"
        }`}
      >
        Open now
      </button>

      <button
        onClick={() => setParam("verified", verifiedOnly ? "0" : "1")}
        className={`rounded-full border px-3 py-1.5 ${
          verifiedOnly ? "border-accent bg-accent/15 text-accent" : "border-border bg-surface text-textPrimary"
        }`}
      >
        Verified only
      </button>
    </div>
  );
}
