"use client";

import { useId } from "react";

/**
 * Calm, minimal night sky rendered as SVG:
 *  - a full moon with high-contrast maria in their real near-side layout, Tycho and
 *    Copernicus with soft ray systems, surface grain, limb darkening, neutral glow
 *  - the Andromeda galaxy at a realistic ~3:1 inclination: soft warm bulge, bluish outer
 *    arm ring, stellar grain, near-side dust lanes clipped inside the disk, M32 and M110
 *  - temperature-coloured stars concentrated along a faint Milky Way band
 *  - low drifting mist and an occasional shooting star with a tapered tail
 *
 * `layout="wide"` covers the viewport (desktop); `layout="narrow"` frames just the moon
 * and galaxy at the top of a phone screen. Gradient/filter ids are namespaced per
 * instance so two skies can live on one page.
 */

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

// Stellar colours weighted like a real naked-eye sky: ~45% warm white, 25% pale yellow,
// 10% orange, 20% blue-white.
const STAR_COLORS = [
  ...Array(9).fill("#fff4e8"),
  ...Array(5).fill("#ffe2c0"),
  ...Array(2).fill("#ffc89a"),
  ...Array(2).fill("#cad7ff"),
  ...Array(2).fill("#9bb0ff"),
] as string[];

type Star = { x: number; y: number; r: number; color: string; bright: boolean; twinkle: boolean; delay: string; dur: string; o: number };

function makeStars(): Star[] {
  const rand = rng(42);
  const star = (x: number, y: number, i: number): Star => {
    const bright = rand() < 0.06;
    const f = rand();
    return {
      x,
      y,
      r: bright ? rand() * 0.7 + 1.2 : rand() * 0.75 + 0.25,
      color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
      bright,
      twinkle: i % 6 === 0,
      delay: (rand() * 6).toFixed(2),
      dur: (3 + rand() * 6).toFixed(2),
      o: bright ? 0.95 : 0.25 + 0.7 * f * f, // weighted toward faint, like a real sky
    };
  };
  const stars: Star[] = [];
  // even background scatter
  for (let i = 0; i < 150; i++) stars.push(star(rand() * 1600, rand() * 800, i));
  // ~3x denser along the Milky Way (centre line through (800,520), tilted -18°)
  const a = (-18 * Math.PI) / 180;
  const inBand = (count: number, spread: number, offset: number, faint: boolean) => {
    for (let i = 0; i < count; i++) {
      const u = (rand() - 0.5) * 2000;
      const v = (rand() + rand() + rand() - 1.5) * spread; // roughly gaussian
      const x = 800 + u * Math.cos(a) - v * Math.sin(a);
      const y = 520 + u * Math.sin(a) + v * Math.cos(a);
      if (x < -10 || x > 1610 || y < -10 || y > 820) continue;
      const s = star(x, y, i + offset);
      if (faint) {
        // unresolved haze of very faint stars that gives the band its texture
        s.r = 0.25 + rand() * 0.15;
        s.o = 0.2 + rand() * 0.3;
        s.bright = false;
        s.twinkle = false;
      }
      stars.push(s);
    }
  };
  inBand(170, 75, 150, false);
  inBand(900, 55, 400, true); // dense unresolved haze that makes the band read as stars, not cloud
  return stars;
}
const STARS = makeStars();
// The three brightest stars get faint 4-point diffraction spikes.
const SPIKED = new Set(
  STARS.map((s, i) => [s.r, i] as const)
    .sort((a, b) => b[0] - a[0])
    .slice(0, 3)
    .map(([, i]) => i),
);

// Blue star-forming knots along Andromeda's outer arms (galaxy-local coordinates).
function makeKnots() {
  const rand = rng(7);
  return Array.from({ length: 34 }, () => {
    const t = rand() * Math.PI * 2;
    const k = 0.66 + rand() * 0.3;
    return { x: Math.cos(t) * 210 * k, y: Math.sin(t) * 66 * k, r: 0.6 + rand() * 1, o: 0.3 + rand() * 0.4 };
  });
}
const KNOTS = makeKnots();

// Pink H II regions (star-forming nebulae), confined to two arm arcs at ~70-85% radius.
function makePinkKnots() {
  const rand = rng(19);
  return Array.from({ length: 12 }, (_, i) => {
    const arc = i % 2 === 0 ? -0.5 : Math.PI - 0.5; // two opposite arm segments
    const t = arc + rand() * 1.1;
    const k = 0.7 + rand() * 0.15;
    return { x: Math.cos(t) * 232 * k, y: Math.sin(t) * 74 * k, r: 0.6 + rand() * 0.3 };
  });
}
const PINK_KNOTS = makePinkKnots();

// Broken, uneven dust-lane fragments on the near side (galaxy-local), within ~70% of the disk length.
const LANES = [
  { d: "M-160 30C-120 42 -80 48 -40 50", w: 4.5, o: 0.55 },
  { d: "M-30 51C10 52 50 50 92 44", w: 5, o: 0.6 },
  { d: "M100 42C125 38 145 33 162 26", w: 3, o: 0.45 },
  { d: "M-140 18C-100 28 -60 33 -20 35", w: 2.5, o: 0.45 },
  { d: "M-8 36C30 37 68 34 110 26", w: 3.5, o: 0.5 },
  { d: "M-100 8C-70 15 -40 19 -6 20", w: 1.5, o: 0.4 },
  { d: "M14 20C44 20 74 16 104 10", w: 2, o: 0.4 },
  { d: "M-150 46C-115 58 -70 64 -30 66", w: 1.8, o: 0.35 },
];

// Tycho's ray system: faint, irregular and long, crossing much of the disk.
const TYCHO_RAYS = [
  { d: "M-4 36Q-16 8 -30 -22", w: 1, o: 0.12 },
  { d: "M-4 36Q6 4 18 -30", w: 0.8, o: 0.1 },
  { d: "M-4 36Q-30 26 -44 6", w: 1.2, o: 0.09 },
  { d: "M-4 36Q20 26 42 8", w: 0.9, o: 0.11 },
  { d: "M-4 36Q0 0 -2 -40", w: 0.6, o: 0.14 },
  { d: "M-4 36Q24 34 44 26", w: 0.7, o: 0.08 },
  { d: "M-4 36Q-26 38 -42 32", w: 0.8, o: 0.1 },
  { d: "M-4 36Q14 14 34 -10", w: 1.1, o: 0.12 },
  { d: "M-4 36Q-14 22 -36 -8", w: 0.7, o: 0.09 },
  { d: "M-4 36Q30 16 44 -4", w: 0.6, o: 0.08 },
  { d: "M-4 36Q-8 20 -18 -36", w: 0.9, o: 0.11 },
  { d: "M-4 36Q-34 14 -46 -12", w: 0.6, o: 0.08 },
];

const VIEW = {
  wide: { viewBox: "0 0 1600 1000", par: "xMidYMid slice" },
  narrow: { viewBox: "560 0 1040 620", par: "xMidYMin meet" },
} as const;

export default function NightSky({ className = "", layout = "wide" }: { className?: string; layout?: "wide" | "narrow" }) {
  const p = useId().replace(/:/g, "");
  const id = (name: string) => `${p}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const v = VIEW[layout];

  return (
    <svg viewBox={v.viewBox} preserveAspectRatio={v.par} className={className} aria-hidden>
      <defs>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03030a" />
          <stop offset="0.55" stopColor="#0a0920" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>

        {/* ---------- moon ---------- */}
        <radialGradient id={id("moonFace")} cx="46%" cy="42%" r="62%">
          <stop offset="0" stopColor="#f7f4ec" />
          <stop offset="0.7" stopColor="#e4dfd2" />
          <stop offset="1" stopColor="#c9c2b2" />
        </radialGradient>
        <radialGradient id={id("moonLimb")} cx="50%" cy="50%" r="50%">
          <stop offset="0.75" stopColor="#1e1b24" stopOpacity="0" />
          <stop offset="1" stopColor="#1e1b24" stopOpacity="0.35" />
        </radialGradient>
        <radialGradient id={id("moonHalo")} cx="50%" cy="50%" r="50%">
          <stop offset="0.55" stopColor="#e8e6dc" stopOpacity="0.18" />
          <stop offset="1" stopColor="#e8e6dc" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("moonHaloWide")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#e8e4d8" stopOpacity="0.1" />
          <stop offset="1" stopColor="#e8e4d8" stopOpacity="0" />
        </radialGradient>
        <filter id={id("moonSpeckle")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" seed="14" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <clipPath id={id("moonClip")}>
          <circle r="46" />
        </clipPath>
        <filter id={id("moonGrain")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="4" seed="8" />
          <feColorMatrix type="saturate" values="0" />
        </filter>

        {/* ---------- Andromeda ---------- */}
        {/* warm inner disk grading to bluer outer arms */}
        <radialGradient id={id("galDisk")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f6e6c4" stopOpacity="0.8" />
          <stop offset="0.2" stopColor="#c8b48a" stopOpacity="0.5" />
          <stop offset="0.48" stopColor="#a9aecb" stopOpacity="0.3" />
          <stop offset="0.8" stopColor="#8fa2c8" stopOpacity="0.13" />
          <stop offset="1" stopColor="#8fa2c8" stopOpacity="0" />
        </radialGradient>
        {/* large bulge with a smooth brightness fall-off (no hard nucleus) */}
        <radialGradient id={id("galCore")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff6e0" />
          <stop offset="0.15" stopColor="#f3d9a0" stopOpacity="0.8" />
          <stop offset="0.45" stopColor="#b89a70" stopOpacity="0.25" />
          <stop offset="1" stopColor="#b89a70" stopOpacity="0" />
        </radialGradient>
        {/* grain stays out of the bright core and fades toward the rim */}
        <radialGradient id={id("galGrainFade")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.3" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <radialGradient id={id("m32")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f3e6c8" />
          <stop offset="1" stopColor="#f3e6c8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("ridge")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfb6d8" stopOpacity="0" />
          <stop offset="0.5" stopColor="#bfb6d8" stopOpacity="1" />
          <stop offset="1" stopColor="#bfb6d8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id("compact")} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff3dc" />
          <stop offset="1" stopColor="#fff3dc" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id("diskInner")}>
          <ellipse rx="226" ry="68" />
        </clipPath>
        <mask id={id("galGrainArea")} maskUnits="userSpaceOnUse" x="-260" y="-100" width="520" height="200">
          <ellipse rx="235" ry="76" fill={url("galGrainFade")} />
        </mask>
        <filter id={id("starGrain")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="21" />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  9 0 0 0 -5.1" />
        </filter>
        <filter id={id("laneWarp")} x="-20%" y="-60%" width="140%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="5" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="1.5" />
        </filter>

        {/* ---------- Milky Way ---------- */}
        <filter id={id("milky")} x="0" y="0" width="100%" height="100%">
          {/* fine, streaky texture along the band (not cloud-like blobs) */}
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.07" numOctaves="4" seed="3" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.78  0 0 0 0 0.76  0 0 0 0 0.95  1.3 0 0 0 -0.55" />
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id={id("milkyFade")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={id("milkyMask")} maskUnits="userSpaceOnUse" x="-400" y="-400" width="2400" height="1800">
          {/* centred on the band axis and long enough that neither end is ever cut off */}
          <rect x="-1400" y="-110" width="2800" height="220" fill={url("milkyFade")} transform="translate(800 520) rotate(-18)" />
        </mask>

        {/* shooting-star tail: transparent → white at the head */}
        <linearGradient id={id("tail")} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="70" y2="35">
          <stop offset="0" stopColor="#f5f3ff" stopOpacity="0" />
          <stop offset="1" stopColor="#f5f3ff" stopOpacity="1" />
        </linearGradient>

        <linearGradient id={id("mist")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6d28d9" stopOpacity="0" />
          <stop offset="1" stopColor="#6d28d9" stopOpacity="0.16" />
        </linearGradient>
        <filter id={id("blur08")}>
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
        <filter id={id("blur04")}>
          <feGaussianBlur stdDeviation="0.4" />
        </filter>
        <filter id={id("blur10")}>
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id={id("blur22")}>
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <linearGradient id={id("bottomFade")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#09090b" stopOpacity="0" />
          <stop offset="1" stopColor="#09090b" stopOpacity="1" />
        </linearGradient>
        <filter id={id("blur06")}>
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
        <filter id={id("blur1")}>
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id={id("blur3")}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id={id("blur6")}>
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={id("blur8")}>
          <feGaussianBlur stdDeviation="8.5" />
        </filter>
        <filter id={id("blur20")}>
          <feGaussianBlur stdDeviation="20" />
        </filter>
      </defs>

      <rect x="0" y="0" width="1600" height="1000" fill={url("sky")} />

      {/* faint Milky Way band */}
      {/* brighter central ridge of the band */}
      <rect x="-1400" y="-40" width="2800" height="80" fill={url("ridge")} opacity="0.12" filter={url("blur20")} transform="translate(800 520) rotate(-18)" />
      <g mask={url("milkyMask")} opacity="0.18">
        <rect width="1600" height="1000" filter={url("milky")} />
      </g>
      {/* the Great Rift: a dark dust lane down the band */}
      <path
        d="M-100 812C250 700 550 600 800 520C1050 440 1350 345 1700 228"
        stroke="#05040a"
        strokeWidth="34"
        fill="none"
        opacity="0.5"
        filter={url("blur8")}
      />

      {/* stars */}
      <g>
        {STARS.map((s, i) => (
          <g key={i}>
            {s.bright && <circle cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={(s.r * 3).toFixed(2)} fill={s.color} opacity="0.16" filter={url("blur3")} />}
            {SPIKED.has(i) && (
              <path
                d={`M${(s.x - 14).toFixed(1)} ${s.y.toFixed(1)}H${(s.x + 14).toFixed(1)}M${s.x.toFixed(1)} ${(s.y - 14).toFixed(1)}V${(s.y + 14).toFixed(1)}`}
                stroke={s.color}
                strokeWidth="0.6"
                strokeOpacity="0.25"
                filter={url("blur04")}
              />
            )}
            <circle
              cx={s.x.toFixed(1)}
              cy={s.y.toFixed(1)}
              r={s.r.toFixed(2)}
              fill={s.color}
              opacity={s.twinkle ? undefined : s.o.toFixed(2)}
              className={s.twinkle ? "star-twinkle" : undefined}
              style={s.twinkle ? { animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` } : undefined}
            />
          </g>
        ))}
      </g>

      {/* ---------- Andromeda (M31), ~3.1:1, inclined ---------- */}
      <g transform="translate(800 180) rotate(-35)">
        <g className="galaxy-breathe">
          <ellipse rx="330" ry="108" fill="#93a4cf" opacity="0.12" filter={url("blur20")} />
          <ellipse rx="232" ry="74" fill={url("galDisk")} filter={url("blur6")} />
          {/* bluish outer arm ring */}
          <ellipse rx="162" ry="52" fill="none" stroke="#8fa8e8" strokeWidth="10" opacity="0.15" filter={url("blur6")} />
          {/* stellar grain, densest toward the centre */}
          <g mask={url("galGrainArea")} style={{ mixBlendMode: "screen" }} opacity="0.25">
            <rect x="-260" y="-100" width="520" height="200" filter={url("starGrain")} />
          </g>
          {/* dust lanes: near side only, kept inside the disk */}
          <g clipPath={url("diskInner")}>
            <g fill="none" stroke="#2a2018" strokeLinecap="round" filter={url("laneWarp")}>
              {LANES.map((l, i) => (
                <path key={i} d={l.d} strokeWidth={l.w} opacity={l.o} />
              ))}
            </g>
          </g>
          {/* blue knots */}
          <g fill="#a9c8ff" filter={url("blur1")}>
            {KNOTS.map((k, i) => (
              <circle key={i} cx={k.x.toFixed(1)} cy={k.y.toFixed(1)} r={k.r.toFixed(2)} opacity={k.o.toFixed(2)} />
            ))}
          </g>
          {/* pink star-forming nebulae */}
          <g fill="#ff9db0" filter={url("blur06")}>
            {PINK_KNOTS.map((k, i) => (
              <circle key={i} cx={k.x.toFixed(1)} cy={k.y.toFixed(1)} r={k.r.toFixed(2)} opacity="0.5" />
            ))}
          </g>
          {/* bulge spanning ~35% of the major axis, smooth fall-off */}
          <ellipse rx="82" ry="38" fill={url("galCore")} filter={url("blur6")} />
          <ellipse rx="16" ry="8" fill="#fff6e0" opacity="0.5" filter={url("blur3")} />
        </g>
        {/* M32: small round blob just outside the lanes */}
        <ellipse cx="30" cy="70" rx="4" ry="3" fill={url("m32")} filter={url("blur1")} />
        <ellipse cx="30" cy="70" rx="8" ry="6" fill={url("m32")} opacity="0.3" />
        {/* M110: larger, dimmer, diffuse */}
        <ellipse cx="-60" cy="-128" rx="28" ry="12.7" transform="rotate(15 -60 -128)" fill={url("compact")} opacity="0.35" filter={url("blur3")} />
      </g>

      {/* ---------- moon (clear of the illustration) ---------- */}
      <g transform="translate(1510 95)">
        {/* steady glow: moonlight doesn't pulse */}
        {/* tight glow that falls off steeply, so the black sky stays black */}
        <circle r="80" fill={url("moonHalo")} />
        <circle r="56" fill="#fffdf5" opacity="0.1" filter={url("blur6")} />
        <circle r="46" fill={url("moonFace")} />
        <g clipPath={url("moonClip")}>
          {/* maria in their real near-side layout (north up, Crisium east/right):
              irregular, soft-edged, in slightly different basalt tones */}
          <g filter={url("blur1")} opacity="0.88">
            {/* Oceanus Procellarum: the large western crescent */}
            <path d="M-41 -14C-46 -2 -43 10 -40 18C-37 27 -33 32 -28 36C-24 33 -21 27 -23 20C-26 13 -21 8 -25 1C-28 -6 -26 -13 -22 -21C-25 -25 -33 -24 -37 -20C-39 -18 -40 -16 -41 -14Z" fill="#6f6f78" opacity="0.72" />
            {/* Mare Imbrium */}
            <path d="M-28 -21C-26 -30 -15 -36 -5 -34C2 -32 7 -26 5 -19C3 -13 -2 -9 -9 -8C-15 -7 -21 -9 -25 -13C-27 -15 -28 -18 -28 -21Z" fill="#6f6f78" opacity="0.8" />
            {/* Mare Frigoris: ragged northern band */}
            <path d="M-31 -34C-22 -39 -10 -40 0 -39C9 -40 19 -37 27 -33C20 -33 12 -35 3 -34C-7 -35 -18 -33 -31 -31Z" fill="#7c7c86" opacity="0.6" />
            {/* Serenitatis */}
            <path d="M5 -21C6 -26 12 -28 17 -26C21 -23 21 -17 19 -13C16 -10 10 -10 7 -13C5 -15 4 -18 5 -21Z" fill="#6f6f78" opacity="0.8" />
            {/* Tranquillitatis */}
            <path d="M10 -8C16 -12 24 -11 29 -7C33 -2 32 4 29 8C26 12 19 12 15 8C12 5 9 2 9 -2C8 -4 8 -6 10 -8Z" fill="#74747e" opacity="0.8" />
            {/* Crisium: separate oval near the eastern limb */}
            <path d="M33 -14C35 -17 39 -16 41 -13C42 -9 41 -5 38 -4C35 -4 33 -7 32 -10C32 -12 32 -13 33 -14Z" fill="#66666f" opacity="0.85" />
            {/* Fecunditatis, Nectaris */}
            <path d="M26 6C29 3 34 5 35 10C36 15 34 20 30 20C27 19 25 15 25 11C25 9 25 7 26 6Z" fill="#7c7c86" opacity="0.7" />
            <path d="M17 15C19 13 23 14 24 17C24 20 21 22 18 21C16 19 16 17 17 15Z" fill="#7c7c86" opacity="0.65" />
            {/* Nubium, Humorum, Vaporum, Cognitum */}
            <path d="M-16 17C-12 14 -4 15 0 18C2 21 0 26 -5 27C-10 27 -15 25 -17 22C-18 20 -17 18 -16 17Z" fill="#8a8a94" opacity="0.65" />
            <path d="M-28 19C-26 17 -22 17 -21 20C-20 23 -22 26 -25 26C-28 25 -29 22 -28 19Z" fill="#6f6f78" opacity="0.7" />
            <path d="M-9 -6C-6 -8 -1 -7 0 -4C1 -1 -2 1 -6 1C-9 0 -10 -3 -9 -6Z" fill="#7c7c86" opacity="0.55" />
            <path d="M-18 6C-15 4 -10 5 -9 8C-9 11 -12 12 -15 11C-18 10 -19 8 -18 6Z" fill="#8a8a94" opacity="0.5" />
          </g>
          {/* surface grain */}
          <rect x="-46" y="-46" width="92" height="92" filter={url("moonGrain")} opacity="0.45" style={{ mixBlendMode: "soft-light" }} />
          {/* Tycho: bright young crater with a soft, curved ray system */}
          {/* inner speckle */}
          <rect x="-46" y="-46" width="92" height="92" filter={url("moonSpeckle")} opacity="0.15" style={{ mixBlendMode: "multiply" }} />
          {/* Tycho's faint, long, irregular rays */}
          <g fill="none" stroke="#ffffff" strokeLinecap="round" filter={url("blur08")}>
            {TYCHO_RAYS.map((r, i) => (
              <path key={i} d={r.d} strokeWidth={r.w} strokeOpacity={Math.min(1, r.o * 1.7)} />
            ))}
          </g>
          <circle cx="-4" cy="36" r="2" fill="#fffef8" filter={url("blur06")} />
          {/* Copernicus */}
          <circle cx="-15" cy="-6" r="1.6" fill="#fbf7ee" filter={url("blur06")} />
          <g stroke="#ffffff" strokeWidth="0.45" opacity="0.1" fill="none" filter={url("blur06")}>
            <path d="M-15 -6L-26 -12M-15 -6L-6 -14M-15 -6L-24 4M-15 -6L-4 2" />
          </g>
          {/* limb darkening */}
          <circle r="46" fill={url("moonLimb")} />
        </g>
      </g>

      {/* shooting star: a short tapered streak travelling across */}
      <g className="shooting-star">
        <line x1="0" y1="0" x2="70" y2="35" stroke={url("tail")} strokeWidth="1.6" strokeLinecap="round" />
      </g>

      {/* low mist */}
      <g className="mist-drift">
        <rect x="-100" y="640" width="1800" height="360" fill={url("mist")} />
        <ellipse cx="500" cy="900" rx="520" ry="70" fill="#7c3aed" opacity="0.07" filter={url("blur20")} />
        <ellipse cx="1250" cy="860" rx="480" ry="60" fill="#22d3ee" opacity="0.04" filter={url("blur20")} />
      </g>

      {/* phone layout ends in a soft fade instead of a hard edge */}
      {layout === "narrow" && <rect x="560" y="500" width="1040" height="120" fill={url("bottomFade")} />}
    </svg>
  );
}
