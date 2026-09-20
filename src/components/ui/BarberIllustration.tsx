// Flat, line-art placeholder illustration for the landing hero — a
// barber mid-cut. Uses currentColor + CSS variables so it re-themes
// automatically with the site's palette (light/dark, whatever colors
// end up in globals.css) with no image asset required.
export default function BarberIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 320" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="160" cy="160" r="150" style={{ fill: "var(--surface-2)" }} />

      {/* chair */}
      <rect x="90" y="210" width="140" height="18" rx="6" style={{ fill: "var(--border)" }} />
      <rect x="100" y="228" width="14" height="46" rx="4" style={{ fill: "var(--border)" }} />
      <rect x="206" y="228" width="14" height="46" rx="4" style={{ fill: "var(--border)" }} />
      <rect x="96" y="150" width="128" height="64" rx="14" style={{ fill: "var(--surface)" }} stroke="var(--border)" strokeWidth="3" />

      {/* seated customer */}
      <circle cx="150" cy="140" r="22" style={{ fill: "var(--gold)" }} opacity="0.35" />
      <path d="M128 175c0-16 10-28 22-28s22 12 22 28" style={{ fill: "var(--gold)" }} opacity="0.25" />

      {/* barber standing, mid-cut */}
      <circle cx="222" cy="96" r="18" style={{ fill: "var(--accent)" }} />
      <path
        d="M198 190c-2-30 6-58 24-70 10-7 22-7 30 0 14 12 20 34 18 58"
        style={{ fill: "var(--accent)" }}
        opacity="0.9"
      />
      {/* arm + scissors */}
      <path d="M204 140c-10 6-18 16-20 28" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" fill="none" />
      <g transform="translate(176,164) rotate(-25)">
        <path d="M0 0l14 4M0 8l14 4" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="0" cy="0" r="3" style={{ fill: "var(--gold)" }} />
        <circle cx="0" cy="8" r="3" style={{ fill: "var(--gold)" }} />
      </g>

      {/* floor line */}
      <line x1="60" y1="274" x2="260" y2="274" stroke="var(--border)" strokeWidth="3" />
    </svg>
  );
}
