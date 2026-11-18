/** A glowing progress ring (0–100). `tone` is a Tailwind text colour class; the ring uses currentColor. */
export default function Ring({
  value,
  size = 64,
  stroke = 6,
  tone = "text-violet-400",
  children,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: string;
  children?: React.ReactNode;
  label?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className={`relative shrink-0 ${tone}`}
      style={{ width: size, height: size, filter: "drop-shadow(0 0 8px currentColor)" }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-zinc-50">{children}</div>
    </div>
  );
}
