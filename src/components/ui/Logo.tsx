export default function Logo({ size = "text-lg" }: { size?: string }) {
  return (
    <span className={`font-display ${size} font-semibold tracking-tight`}>
      Trim
    </span>
  );
}
