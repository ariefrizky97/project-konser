import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/site/Countdown";
import { Media } from "@/components/site/Cover";
import { EventCard, isOngoing } from "@/components/site/EventCard";
import { IconCalendar, IconClock, IconPin, IconTicket, IconUsers } from "@/components/site/Icons";
import { SectionHead } from "@/components/site/SectionHead";
import { ShareButtons } from "@/components/site/ShareButtons";
import { googleCalendarUrl, mapsUrl } from "@/lib/calendar";
import { dayKey, formatDateFull, formatTime, safeUrl, toneStyle } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { getEventBySlug, listEvents } from "@/lib/queries";
import { siteUrl } from "@/lib/settings";
import { skeletonDelay } from "@/lib/skeleton";

type Props = { params: Promise<{ slug: string }> };

const loadEvent = cache((slug: string) => getEventBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await loadEvent((await params).slug);
  if (!event) return { title: "Event tidak ditemukan" };
  return {
    title: event.title,
    description: event.summary,
    alternates: { canonical: `/event/${event.slug}` },
    openGraph: {
      title: event.title,
      description: event.summary,
      images: event.cover_url ? [event.cover_url] : undefined,
    },
  };
}

export default async function EventPage({ params }: Props) {
  const event = await loadEvent((await params).slug);
  if (!event) notFound();

  const now = new Date();
  const [related] = await Promise.all([
    listEvents({ typeSlug: event.type_slug ?? undefined, excludeId: event.id, limit: 3 }),
    skeletonDelay(),
  ]);

  const url = `${siteUrl()}/event/${event.slug}`;
  const ticketUrl = safeUrl(event.ticket_url);
  const multiDay = event.ends_at !== null && dayKey(event.ends_at) !== dayKey(event.starts_at);
  const upcoming = event.starts_at > now;
  const finished = !upcoming && !isOngoing(event, now);

  const dateText = multiDay && event.ends_at
    ? `${formatDateFull(event.starts_at)} sampai ${formatDateFull(event.ends_at)}`
    : formatDateFull(event.starts_at);
  const timeText = event.all_day
    ? "Sepanjang hari"
    : event.ends_at && !multiDay
      ? `${formatTime(event.starts_at)} sampai ${formatTime(event.ends_at)} WIB`
      : `Mulai ${formatTime(event.starts_at)} WIB`;

  return (
    <>
      <article className="wrap event">
        <header className="event-head">
          <div className="event-tags">
            {event.type_name && event.type_slug && (
              <Link href={`/event?tipe=${event.type_slug}`} className="tag" style={toneStyle(event.type_color)}>
                {event.type_name}
              </Link>
            )}
            {isOngoing(event, now) && <span className="live">Sedang berlangsung</span>}
            {finished && <span className="tag tag--line">Sudah selesai</span>}
          </div>
          <h1 className="article-title rise">{event.title}</h1>
          {event.summary && <p className="article-lede">{event.summary}</p>}
        </header>

        <div className="event-grid">
          <div className="event-main">
            <div className="article-media shutter">
              <Media src={event.cover_url} seed={event.slug} alt="" width={1400} />
            </div>
            {event.description && (
              <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(event.description) }} />
            )}
            <ShareButtons url={url} title={event.title} />
          </div>

          <aside className="facts" aria-label="Info acara">
            {upcoming && (
              <div className="facts-count">
                <p className="rail-count-label">Mulai dalam</p>
                <Countdown target={event.starts_at.toISOString()} now={now.toISOString()} />
              </div>
            )}
            <dl className="facts-list">
              <div>
                <dt><IconCalendar /> Tanggal</dt>
                <dd>{dateText}</dd>
              </div>
              <div>
                <dt><IconClock /> Waktu</dt>
                <dd>{timeText}</dd>
              </div>
              {(event.venue_name || event.city) && (
                <div>
                  <dt><IconPin /> Tempat</dt>
                  <dd>
                    {event.venue_name && <strong>{event.venue_name}</strong>}
                    {(event.address || event.city) && <span>{event.address || event.city}</span>}
                    <a
                      href={mapsUrl(event.venue_name, event.address, event.city)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buka di peta
                    </a>
                  </dd>
                </div>
              )}
              {event.price_info && (
                <div>
                  <dt><IconTicket /> Harga</dt>
                  <dd>{event.price_info}</dd>
                </div>
              )}
              {event.organizer_name && (
                <div>
                  <dt><IconUsers /> Penyelenggara</dt>
                  <dd>{event.organizer_name}</dd>
                </div>
              )}
            </dl>
            <div className="facts-actions">
              {ticketUrl && !finished && (
                <a href={ticketUrl} className="btn" target="_blank" rel="noopener noreferrer">
                  Buka halaman tiket
                </a>
              )}
              {!finished && (
                <>
                  <a
                    href={googleCalendarUrl(event, url)}
                    className="btn btn--line"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Tambah ke Google Calendar
                  </a>
                  <a href={`/event/${event.slug}/kalender`} className="btn btn--line" download>
                    Unduh file kalender
                  </a>
                </>
              )}
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="wrap sec">
          <SectionHead title="Event serupa" href="/event" linkLabel="Semua agenda" />
          <div className="grid3">
            {related.map((item) => (
              <EventCard key={item.id} event={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
