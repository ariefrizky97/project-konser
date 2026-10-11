// Logo Project Konser, mengikuti berkas logo pemilik situs: enam batang ekualiser kuning
// (#FFCC00, ujung bulat, tertinggi di tengah) dan tulisan PROJECT / KONSER dua baris
// dalam Poppins Bold, rata bawah dengan batangnya.

const BARS = [
  { x: 0, y: 280 },
  { x: 67, y: 100 },
  { x: 134.5, y: 135 },
  { x: 201.5, y: 0 },
  { x: 269, y: 140 },
  { x: 336.5, y: 280 },
];

/**
 * Tanda logo saja. `intro` membuat batangnya tumbuh satu per satu sekali saat tampil
 * (layar pembuka, halaman masuk); setelah itu bentuknya tetap sama persis dengan logo.
 */
export function LogoMark({ className = "", intro = false, live = false }: { className?: string; intro?: boolean; live?: boolean }) {
  return (
    <svg
      className={`logo-bars${intro ? " logo-bars--intro" : ""}${live ? " logo-bars--live" : ""} ${className}`.trim()}
      viewBox="0 0 393 515"
      width="29"
      height="38"
      aria-hidden="true"
      focusable="false"
    >
      {BARS.map((bar, index) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width="56"
          height={515 - bar.y}
          rx="28"
          fill="#FFCC00"
          style={{ "--b": index } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}

/** Nama situs dua baris: kata pertama di atas, sisanya di bawah ("PROJECT" / "KONSER"). */
export function Wordmark({ name, className = "" }: { name: string; className?: string }) {
  const words = name.trim().split(/\s+/);
  const top = words[0] ?? "";
  const bottom = words.slice(1).join(" ");
  return (
    <span className={`logo-word ${className}`.trim()}>
      <span>{top}</span>
      {bottom && <span> {bottom}</span>}
    </span>
  );
}

/** `live`: setelah muncul, batang terus bergerak pelan seperti ekualiser (halaman masuk). */
export function Logo({ name, intro = false, live = false }: { name: string; intro?: boolean; live?: boolean }) {
  return (
    <span className={`logo${intro ? " logo--intro" : ""}${live ? " logo--live" : ""}`}>
      <LogoMark intro={intro} live={live} />
      <Wordmark name={name} />
    </span>
  );
}
