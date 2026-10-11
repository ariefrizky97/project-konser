import type { Metadata } from "next";
import { safeUrl } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { getSettings } from "@/lib/settings";
import { skeletonDelay } from "@/lib/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return { title: "Tentang kami", description: settings.description };
}

// Judul "Pasang iklan" di teks Tentang diberi id supaya tautan /tentang#iklan mendarat di sana.
function withAnchors(html: string): string {
  return html.replace(/<h2>(\s*Pasang iklan[^<]*)<\/h2>/i, '<h2 id="iklan">$1</h2>');
}

export default async function AboutPage() {
  const [settings] = await Promise.all([getSettings(), skeletonDelay()]);
  const socials = [
    { label: "Instagram", href: safeUrl(settings.instagram) },
    { label: "YouTube", href: safeUrl(settings.youtube) },
    { label: "TikTok", href: safeUrl(settings.tiktok) },
    { label: "Facebook", href: safeUrl(settings.facebook) },
  ].filter((item) => item.href);

  return (
    <article className="wrap page page--narrow">
      <header className="page-head">
        <h1 className="page-title">Tentang {settings.site_name}</h1>
        <p className="lede">{settings.tagline}</p>
      </header>

      {settings.about ? (
        <div className="prose" dangerouslySetInnerHTML={{ __html: withAnchors(renderMarkdown(settings.about)) }} />
      ) : (
        <p className="empty">Teks halaman ini bisa diisi dari Admin, menu Pengaturan.</p>
      )}

      {(settings.contact_email || socials.length > 0) && (
        <div className="contact">
          <h2 className="sec-title">Hubungi kami</h2>
          <div className="contact-links">
            {settings.contact_email && (
              <a className="btn" href={`mailto:${settings.contact_email}`}>
                {settings.contact_email}
              </a>
            )}
            {socials.map((item) => (
              <a key={item.label} className="btn btn--line" href={item.href} target="_blank" rel="noopener noreferrer">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
