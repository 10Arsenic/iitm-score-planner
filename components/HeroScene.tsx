"use client";

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

const HAS_CUTOUT = false;

/**
 * Animated swordswoman built from a still poster:
 *  - the whole figure breathes (scale anchored at the feet)
 *  - a copy of the hair region runs through an animated turbulence filter (wind)
 *  - the glowing blade pulses, and light travels down it; the back sword glints
 *  - water rings spread from her feet, motes and wind wisps drift past
 *
 * Source art: public/hero/poster.webp is a 506x777 screenshot whose artwork
 * occupies x 30-441, y 46-777. All overlay coordinates are in that artwork's
 * 411x731 space. If public/hero/character.png exists (the same 506x777 image
 * with its background removed) it is used instead, so the new night sky shows
 * through behind her; until then the poster's own forest is faded out at the edges.
 */

const ART_W = 411;
const ART_H = 731;

// Position the 506x777 source so only the 411x731 artwork fills the box.
const IMG_STYLE: CSSProperties = { left: "-7.3%", top: "-6.29%", width: "123.11%", height: "106.29%" };

// Hair region (percent of the full 506x777 source), excluding the face.
const HAIR_CLIP =
  "polygon(38.5% 20.6%, 40.5% 14.2%, 49.4% 11.3%, 59.3% 10.3%, 65.2% 12.9%, 68.2% 20.6%, 71.1% 32.2%, 72.1% 42.5%, 70.2% 54.1%, 65.2% 52.8%, 63.2% 42.5%, 59.3% 30.9%, 54.3% 21.9%, 51.8% 18%, 45.5% 16.7%, 42.5% 21.9%, 41.5% 29.6%, 39.5% 38.6%, 37.5% 37.3%)";

// Poster fallback: feather the forest away so it melts into the new sky.
// Layers (top first): her head is ADDED back on top of the intersection of a long top fade
// (hides the painted lavender sky line), a bottom fade, left/right ramps and a corner-rounding
// radial — so every edge dissolves but her hair and face stay fully opaque.
const FEATHER = [
  "radial-gradient(ellipse 18% 10% at 62% 9%, #000 55%, transparent 100%)",
  "linear-gradient(to bottom, transparent 0%, #000 16%)",
  "linear-gradient(to top, transparent 0%, #000 16%)",
  "linear-gradient(to right, transparent 0%, #000 22%, #000 80%, transparent 100%)",
  "radial-gradient(ellipse 72% 82% at 55% 50%, #000 55%, transparent 100%)",
].join(", ");
const POSTER_MASK: CSSProperties = {
  WebkitMaskImage: FEATHER,
  maskImage: FEATHER,
  WebkitMaskComposite: "source-over, source-in, source-in, source-in, source-over",
  maskComposite: "add, intersect, intersect, intersect, add",
};

const MOTES = [
  { x: 120, y: 560, d: 0 },
  { x: 330, y: 520, d: 2.2 },
  { x: 210, y: 640, d: 4.1 },
  { x: 370, y: 610, d: 6 },
  { x: 90, y: 470, d: 7.3 },
];

export default function HeroScene({ className = "" }: { className?: string }) {
  // Set HAS_CUTOUT to true after adding public/hero/character.png (no probe request, so no 404 in the console).
  const cutout = HAS_CUTOUT;
  const src = cutout ? "/hero/character.png" : "/hero/poster.webp";

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${ART_W} / ${ART_H}` }}>
      {/* wind for the hair: drifting fractal noise displaces the pixels */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="hair-wind" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.03" numOctaves="2" seed="11" result="noise">
            <animate attributeName="baseFrequency" dur="8s" values="0.006 0.03;0.009 0.038;0.006 0.03" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* faint violet light behind her shoulders, tying her into the sky */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[15%]"
        style={{ background: "radial-gradient(260px circle at 58% 38%, rgba(139, 92, 246, 0.12), transparent 70%)" }}
      />

      <div className="hero-breathe absolute inset-0 overflow-hidden" style={cutout ? undefined : POSTER_MASK}>
        <img src={src} alt="Swordswoman holding a glowing katana" style={IMG_STYLE} className="absolute max-w-none select-none" draggable={false} />
        <img
          src={src}
          alt=""
          aria-hidden
          draggable={false}
          style={{ ...IMG_STYLE, filter: "url(#hair-wind)", clipPath: HAIR_CLIP }}
          className="hero-hair absolute max-w-none select-none"
        />
        {/* water rings live inside the feathered layer so they fade with the water */}
        <svg viewBox={`0 0 ${ART_W} ${ART_H}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <filter id="ripple-soft" x="-20%" y="-200%" width="140%" height="500%">
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </defs>
          {/* feathered rings, not crisp UI circles */}
          <g fill="none" stroke="#c4b5fd" strokeWidth="0.8" filter="url(#ripple-soft)">
            <ellipse className="ripple" cx="240" cy="700" rx="120" ry="14" />
            <ellipse className="ripple ripple-2" cx="240" cy="700" rx="120" ry="14" />
            <ellipse className="ripple ripple-3" cx="240" cy="700" rx="120" ry="14" />
          </g>
        </svg>
      </div>

      {/* light + air overlays, in artwork coordinates */}
      <svg viewBox={`0 0 ${ART_W} ${ART_H}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <filter id="glow-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id="glow-tight" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* glowing katana: halo pulse + travelling light */}
        <g style={{ mixBlendMode: "screen" }}>
          <line className="blade-pulse" x1="208" y1="394" x2="407" y2="674" stroke="#8b5cf6" strokeWidth="16" strokeLinecap="round" filter="url(#glow-soft)" />
          <line className="blade-pulse" x1="208" y1="394" x2="407" y2="674" stroke="#c4b5fd" strokeWidth="4" strokeLinecap="round" filter="url(#glow-tight)" />
          <line className="blade-shimmer" x1="208" y1="394" x2="407" y2="674" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" filter="url(#glow-tight)" />
          {/* back sword glint */}
          <line className="blade-shimmer blade-shimmer-b" x1="270" y1="442" x2="348" y2="486" stroke="#a5f3fc" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow-tight)" />
        </g>

        {/* wind wisps crossing the frame */}
        {/* broad, very soft streaks of moving air rather than crisp lines */}
        <g fill="none" stroke="#e9d5ff" strokeWidth="5" strokeLinecap="round" filter="url(#glow-soft)">
          <path className="wisp" d="M40 230C110 214 170 236 240 222" />
          <path className="wisp" style={{ animationDelay: "3.5s" }} d="M150 330C220 316 290 338 370 322" />
          <path className="wisp" style={{ animationDelay: "7s" }} d="M60 470C130 456 200 478 270 464" />
        </g>

        {/* drifting light motes */}
        <g fill="#ddd6fe">
          {MOTES.map((m, i) => (
            <circle key={i} className="mote" cx={m.x} cy={m.y} r="2.2" filter="url(#glow-tight)" style={{ animationDelay: `${m.d}s` }} />
          ))}
        </g>
      </svg>
    </div>
  );
}
