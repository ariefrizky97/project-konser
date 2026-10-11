import { safeUrl } from "@/lib/format";
import type { Settings } from "@/lib/types";
import { IconFacebook, IconInstagram, IconThreads, IconTiktok, IconYoutube } from "./Icons";

/** Tautan media sosial sebagai ikon. Alamatnya diatur dari Admin > Pengaturan. */
export function Social({ settings, className = "" }: { settings: Settings; className?: string }) {
  const items = [
    { label: "Instagram", href: safeUrl(settings.instagram), Icon: IconInstagram },
    { label: "TikTok", href: safeUrl(settings.tiktok), Icon: IconTiktok },
    { label: "Threads", href: safeUrl(settings.threads), Icon: IconThreads },
    { label: "YouTube", href: safeUrl(settings.youtube), Icon: IconYoutube },
    { label: "Facebook", href: safeUrl(settings.facebook), Icon: IconFacebook },
  ].filter((item) => item.href);
  if (!items.length) return null;

  return (
    <span className={`social ${className}`.trim()}>
      {items.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} ${settings.site_name}`}
          title={label}
        >
          <Icon />
        </a>
      ))}
    </span>
  );
}
