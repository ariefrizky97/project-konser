import Link from "next/link";

/** Judul bagian dengan tautan "lihat semua" opsional di kanan. */
export function SectionHead({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="sec-head">
      <h2 className="sec-title">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="sec-more">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
