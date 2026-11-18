export type IconName = "shield" | "bolt" | "target" | "compass" | "lock" | "flask" | "pencil" | "flag";

const PATHS: Record<IconName, string> = {
  shield: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z",
  bolt: "M13 3L5 14h6l-1 7 8-11h-6l1-7z",
  target: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-5a4 4 0 100-8 4 4 0 000 8zm0-3a1 1 0 100-2 1 1 0 000 2z",
  compass: "M12 21a9 9 0 100-18 9 9 0 000 18zm3.5-12.5l-2 5-5 2 2-5 5-2z",
  lock: "M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z",
  flask: "M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3",
  pencil: "M4 20l1-4L16 5l3 3L8 19l-4 1zM14 7l3 3",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
};

/** One stroke width, one size family — replaces ad-hoc emoji. */
export default function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}
