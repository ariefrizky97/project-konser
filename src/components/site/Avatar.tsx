import { sized } from "@/lib/media";

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase() || "?";
}

export type Crop = { x: number; y: number; zoom: number };
export const CENTER: Crop = { x: 50, y: 50, zoom: 1 };

/** "x,y,zoom" → angka yang sudah dibatasi. Teks kosong atau rusak berarti tengah tanpa perbesaran. */
export function parseCrop(value: string | null | undefined): Crop {
  const [x, y, zoom] = (value ?? "").split(",").map(Number);
  if (![x, y, zoom].every(Number.isFinite)) return CENTER;
  const clamp = (number: number, min: number, max: number) => Math.min(max, Math.max(min, number));
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100), zoom: clamp(zoom, 1, 3) };
}

export const cropStyle = (crop: Crop): React.CSSProperties => ({
  objectPosition: `${crop.x}% ${crop.y}%`,
  transform: crop.zoom > 1 ? `scale(${crop.zoom})` : undefined,
  transformOrigin: `${crop.x}% ${crop.y}%`,
});

/** Foto profil bulat, dengan posisi dan perbesaran pilihan pemiliknya. Tanpa foto, tampil inisial. */
export function Avatar({
  name,
  src,
  crop,
  className = "",
}: {
  name: string;
  src?: string | null;
  crop?: string | null;
  className?: string;
}) {
  return (
    <span className={`avatar ${className}`.trim()} aria-hidden="true">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sized(src, 320)} alt="" loading="lazy" decoding="async" style={cropStyle(parseCrop(crop))} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
