import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Media } from "@/components/site/Cover";
import { EventRow } from "@/components/site/EventCard";
import { SectionHead } from "@/components/site/SectionHead";
import { safeUrl } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { getDirectoryBySlug, listEventsByName } from "@/lib/queries";
import { skeletonDelay } from "@/lib/skeleton";
import { DIRECTORY_LABELS } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

const loadEntry = cache((slug: string) => getDirectoryBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = await loadEntry((await params).slug);
  if (!entry) return { title: "Entri tidak ditemukan" };
  return {
    title: `${entry.name} (${DIRECTORY_LABELS[entry.kind]})`,
    description: entry.summary,
    alternates: { canonical: `/direktori/${entry.slug}` },
  };
}

/** Kontak berupa email atau nomor telepon dijadikan tautan; selain itu tampil sebagai teks. */
function contactHref(contact: string): string | null {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return `mailto:${contact}`;
  const digits = contact.replace(/[^\d+]/g, "");
  if (digits.length >= 8 && /^[+\d][\d\s().-]+$/.test(contact)) return `tel:${digits}`;
  return null;
}

export default async function DirectoryEntryPage({ params }: Props) {
  const entry = await loadEntry((await params).slug);
  if (!entry) notFound();

  const [events] = await Promise.all([listEventsByName(entry.name, 6), skeletonDelay()]);
  const website = safeUrl(entry.website);
  const contact = entry.contact ? contactHref(entry.contact) : null;

  return (
    <>
      <article className="wrap event">
        <header className="event-head">
          <div className="event-tags">
            <Link href={`/direktori?jenis=${entry.kind}`} className="tag">
              {DIRECTORY_LABELS[entry.kind]}
            </Link>
          </div>
          <h1 className="article-title rise">{entry.name}</h1>
          {entry.summary && <p className="article-lede">{entry.summary}</p>}
        </header>

        <div className="event-grid">
          <div className="event-main">
            <div className="article-media shutter">
              <Media src={entry.cover_url} seed={entry.slug} alt="" width={1400} />
            </div>
            {entry.description && (
              <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.description) }} />
            )}
          </div>

          <aside className="facts" aria-label="Kontak">
            <dl className="facts-list">
              {entry.city && (
                <div>
                  <dt>Kota</dt>
                  <dd>{entry.city}</dd>
                </div>
              )}
              {entry.address && (
                <div>
                  <dt>Alamat</dt>
                  <dd>{entry.address}</dd>
                </div>
              )}
              {entry.contact && (
                <div>
                  <dt>Kontak</dt>
                  <dd>{contact ? <a href={contact}>{entry.contact}</a> : entry.contact}</dd>
                </div>
              )}
              {entry.instagram && (
                <div>
                  <dt>Instagram</dt>
                  <dd>
                    <a
                      href={`https://instagram.com/${encodeURIComponent(entry.instagram)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{entry.instagram}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {website && (
              <div className="facts-actions">
                <a href={website} className="btn" target="_blank" rel="noopener noreferrer">
                  Buka situs web
                </a>
              </div>
            )}
          </aside>
        </div>
      </article>

      {events.length > 0 && (
        <section className="wrap sec">
          <SectionHead title={`Agenda bersama ${entry.name}`} href="/event" linkLabel="Semua agenda" />
          <div className="erows">
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
