// Sampul bawaan untuk konten tanpa gambar. Polanya dibuat dari slug,
// jadi konten yang sama selalu mendapat sampul yang sama.

import { sized } from "@/lib/media";
import { youtubeId, youtubeThumb } from "@/lib/youtube";

// Palet sengaja berkontras rendah supaya sampul tidak melelahkan mata.
const INK = "#26221B";
const GRAPHITE = "#3B362D";
const STEEL = "#B3AA96";
const PAPER = "#F1EBDC";
const SUN = "#E9C24D";
const SAND = "#DDD3BC";

const W = 800;
const H = 500;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function randomFrom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Draw = (rand: () => number) => React.ReactNode;

// Sorot lampu panggung dari atas.
const beams: Draw = (rand) => {
  const sources = [160 + rand() * 80, 380 + rand() * 60, 600 + rand() * 80];
  return (
    <>
      <rect width={W} height={H} fill={INK} />
      {sources.map((x, i) => {
        const lean = (rand() - 0.5) * 260;
        const spread = 90 + rand() * 70;
        const foot = x + lean;
        return (
          <polygon
            key={i}
            points={`${x - 8},0 ${x + 8},0 ${foot + spread},${H} ${foot - spread},${H}`}
            fill={SUN}
            opacity={[0.8, 0.45, 0.25][i]}
          />
        );
      })}
      {Array.from({ length: 13 }, (_, i) => (
        <circle key={i} cx={30 + i * 62} cy={H - 6 + rand() * 12} r={30 + rand() * 14} fill={INK} />
      ))}
    </>
  );
};

// Raster titik seperti cetakan poster.
const halftone: Draw = (rand) => {
  const fx = 0.2 + rand() * 0.6;
  const fy = 0.2 + rand() * 0.6;
  const dots: React.ReactNode[] = [];
  for (let row = 0; row < 7; row += 1) {
    for (let col = 0; col < 11; col += 1) {
      const x = 40 + col * 72;
      const y = 34 + row * 72;
      const distance = Math.hypot(x / W - fx, y / H - fy);
      const radius = Math.max(3, 34 - distance * 52);
      dots.push(<circle key={`${row}-${col}`} cx={x} cy={y} r={radius} fill={SUN} />);
    }
  }
  return (
    <>
      <rect width={W} height={H} fill={GRAPHITE} />
      {dots}
    </>
  );
};

// Pita polos melintang di depan lingkaran besar.
const tape: Draw = (rand) => {
  const angle = -18 + rand() * 36;
  const y = 170 + rand() * 120;
  return (
    <>
      <rect width={W} height={H} fill={GRAPHITE} />
      <circle cx={180 + rand() * 440} cy={250} r={170 + rand() * 50} fill={PAPER} />
      <g transform={`rotate(${angle} ${W / 2} ${H / 2})`}>
        <rect x={-200} y={y} width={W + 400} height={96} fill={SUN} />
        <rect x={-200} y={y + 12} width={W + 400} height={3} fill={INK} opacity={0.35} />
        <rect x={-200} y={y + 81} width={W + 400} height={3} fill={INK} opacity={0.35} />
      </g>
    </>
  );
};

// Lingkaran bergema dari satu titik, seperti corong pengeras suara.
const rings: Draw = (rand) => {
  const cx = rand() > 0.5 ? 120 + rand() * 120 : W - 120 - rand() * 120;
  const cy = 140 + rand() * 220;
  return (
    <>
      <rect width={W} height={H} fill={PAPER} />
      {Array.from({ length: 9 }, (_, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={70 + i * 62}
          fill="none"
          stroke={SAND}
          strokeWidth={22 - i * 2}
        />
      ))}
      <circle cx={cx} cy={cy} r={48} fill={SUN} stroke={GRAPHITE} strokeWidth={10} />
    </>
  );
};

// Batang ekualiser.
const bars: Draw = (rand) => {
  const count = 16;
  const gap = 12;
  const width = (W - 80 - gap * (count - 1)) / count;
  const accent = Math.floor(rand() * count);
  return (
    <>
      <rect width={W} height={H} fill={INK} />
      {Array.from({ length: count }, (_, i) => {
        const height = 70 + rand() * 340;
        return (
          <rect
            key={i}
            x={40 + i * (width + gap)}
            y={H - 40 - height}
            width={width}
            height={height}
            rx={width / 2}
            fill={i === accent ? SUN : STEEL}
          />
        );
      })}
    </>
  );
};

// Tiket besar dengan sobekan.
const ticket: Draw = (rand) => {
  const angle = -10 + rand() * 20;
  return (
    <>
      <rect width={W} height={H} fill={STEEL} />
      <g transform={`rotate(${angle} ${W / 2} ${H / 2})`}>
        <rect x={110} y={120} width={580} height={260} rx={26} fill={PAPER} />
        <rect x={110} y={120} width={170} height={260} rx={26} fill={SUN} />
        <rect x={250} y={120} width={30} height={260} fill={SUN} />
        <circle cx={280} cy={120} r={22} fill={STEEL} />
        <circle cx={280} cy={380} r={22} fill={STEEL} />
        {Array.from({ length: 7 }, (_, i) => (
          <circle key={i} cx={280} cy={160 + i * 30} r={5} fill={STEEL} />
        ))}
        <rect x={320} y={170} width={300} height={26} rx={13} fill={INK} />
        <rect x={320} y={220} width={210} height={18} rx={9} fill={STEEL} />
        <rect x={320} y={256} width={250} height={18} rx={9} fill={STEEL} />
        <rect x={320} y={312} width={110} height={32} rx={16} fill={INK} />
      </g>
    </>
  );
};

const PATTERNS: Draw[] = [beams, halftone, tape, rings, bars, ticket];

export function Cover({ seed }: { seed: string }) {
  const value = hash(seed || "sampul");
  const draw = PATTERNS[value % PATTERNS.length];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {draw(randomFrom(value))}
    </svg>
  );
}

/**
 * Gambar sampul bila ada. Tanpa sampul, artikel yang punya video memakai gambar pratinjau
 * YouTube-nya; selain itu sampul bawaan. `width` adalah lebar yang diminta ke ImageKit.
 */
export function Media({
  src,
  seed,
  alt = "",
  width = 900,
  video,
}: {
  src: string | null;
  seed: string;
  alt?: string;
  width?: number;
  /** Tautan YouTube konten ini, bila ada. */
  video?: string | null;
}) {
  const videoId = !src && video ? youtubeId(video) : null;
  const image = src ? sized(src, width) : videoId ? youtubeThumb(videoId) : null;
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={alt} loading="lazy" decoding="async" />;
  }
  return <Cover seed={seed} />;
}
