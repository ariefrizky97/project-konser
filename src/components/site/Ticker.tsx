import Link from "next/link";
import { toneStyle } from "@/lib/format";

export type TickerItem = {
  key: string;
  text: string;
  /** Tautan tujuan. Kosong berarti teks biasa. */
  href: string;
  /** Label kecil di depan teks (kategori), beserta warnanya. */
  label?: string | null;
  color?: string | null;
  /** Keterangan kecil di belakang teks (umur berita). */
  note?: string;
};

/**
 * Pita teks berjalan. Isi digandakan supaya putarannya mulus; salinan kedua
 * disembunyikan dari pembaca layar dan urutan tab. `seconds` adalah lama satu putaran.
 */
export function Ticker({ items, seconds = 90 }: { items: TickerItem[]; seconds?: number }) {
  if (!items.length) return null;
  const row = (hidden: boolean) =>
    items.map((item) => (
      <span className="ticker-item" key={`${hidden ? "b" : "a"}-${item.key}`}>
        {item.label && (
          <span className="ticker-cat" style={toneStyle(item.color)}>
            {item.label}
          </span>
        )}
        {item.href ? (
          <Link href={item.href} tabIndex={hidden ? -1 : undefined}>
            {item.text}
          </Link>
        ) : (
          <span className="ticker-text">{item.text}</span>
        )}
        {item.note && <span className="ticker-time">{item.note}</span>}
      </span>
    ));

  return (
    <div className="ticker">
      <span className="ticker-label">
        <span className="ticker-live" aria-hidden="true" />
        Kabar terbaru
      </span>
      <div className="ticker-view">
        <div className="ticker-track" style={{ animationDuration: `${seconds}s` }}>
          <div className="ticker-set">{row(false)}</div>
          <div className="ticker-set" aria-hidden="true">
            {row(true)}
          </div>
        </div>
      </div>
    </div>
  );
}
