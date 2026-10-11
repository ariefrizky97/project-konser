import type { AdContent } from "@/lib/types";

/**
 * Tampilan iklan menurut template. Dipakai di situs dan di pratinjau admin,
 * jadi yang dilihat admin sama dengan yang tayang.
 */
export function AdView({
  ad,
  href,
  external = false,
}: {
  ad: AdContent;
  href: string;
  /** Buka di tab baru. Dipakai bila tujuan iklan adalah situs lain. */
  external?: boolean;
}) {
  const linkProps = {
    href: href || undefined,
    className: `ad ad--${ad.template} ad--${ad.tone}`,
    ...(external ? { target: "_blank", rel: "sponsored noopener" } : {}),
  };

  if (ad.template === "image") {
    return (
      <a {...linkProps}>
        {ad.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="ad-img" src={ad.image_url} alt={ad.headline || "Iklan"} />
        ) : (
          <span className="ad-empty">Pilih gambar banner</span>
        )}
        <span className="ad-flag">Iklan</span>
      </a>
    );
  }

  return (
    <a {...linkProps}>
      {ad.template === "split" && (
        <span className="ad-thumb">
          {ad.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.image_url} alt="" />
          ) : null}
        </span>
      )}
      <span className="ad-body">
        <span className="ad-head">{ad.headline || "Judul iklan"}</span>
        {ad.subline && <span className="ad-sub">{ad.subline}</span>}
      </span>
      {ad.cta_label && <span className="ad-cta">{ad.cta_label}</span>}
      <span className="ad-flag">Iklan</span>
    </a>
  );
}
