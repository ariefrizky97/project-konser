import Link from "next/link";
import { dateBlock, dayKey, formatEventRange, toneStyle } from "@/lib/format";
import type { EventItem } from "@/lib/types";

function place(event: EventItem): string {
  return [event.venue_name, event.city].filter(Boolean).join(", ");
}

/** Benar bila event sudah mulai dan belum selesai. */
export function isOngoing(event: EventItem, now: Date = new Date()): boolean {
  const end = event.ends_at ?? new Date(event.starts_at.getTime() + 6 * 60 * 60 * 1000);
  return event.starts_at <= now && end >= now;
}

/** Blok tanggal kuning. Event lebih dari satu hari menampilkan tanggal akhirnya juga. */
export function DateBlock({ event }: { event: EventItem }) {
  const start = dateBlock(event.starts_at);
  const multiDay = event.ends_at && dayKey(event.ends_at) !== dayKey(event.starts_at);
  const end = multiDay && event.ends_at ? dateBlock(event.ends_at) : null;
  return (
    <span className="dateblock">
      <span className="dateblock-day">{start.day}</span>
      <span className="dateblock-month">{start.month}</span>
      {end && (
        <span className="dateblock-to">
          s.d. {end.day} {end.month !== start.month ? end.month : ""}
        </span>
      )}
    </span>
  );
}

/** Kartu event berbentuk tiket: tanggal di sobekan kiri, keterangan di kanan. */
export function EventCard({ event, index = 0 }: { event: EventItem; index?: number }) {
  return (
    <Link href={`/event/${event.slug}`} className="tix" style={{ "--i": index } as React.CSSProperties}>
      <DateBlock event={event} />
      <span className="tix-body">
        {isOngoing(event) ? (
          <span className="live">Sedang berlangsung</span>
        ) : (
          event.type_name && <span className="tix-type">{event.type_name}</span>
        )}
        <span className="tix-title">{event.title}</span>
        <span className="tix-place">{place(event)}</span>
      </span>
    </Link>
  );
}

/** Baris event untuk halaman agenda: lebih lebar, dengan waktu dan harga. */
export function EventRow({ event }: { event: EventItem }) {
  return (
    <Link href={`/event/${event.slug}`} className="erow">
      <DateBlock event={event} />
      <span className="erow-body">
        <span className="erow-top">
          {event.type_name && (
            <span className="tag" style={toneStyle(event.type_color)}>
              {event.type_name}
            </span>
          )}
          {isOngoing(event) && <span className="live">Sedang berlangsung</span>}
        </span>
        <span className="erow-title">{event.title}</span>
        <span className="erow-info">
          {formatEventRange(event.starts_at, event.ends_at, event.all_day)}
          {place(event) && <span className="erow-place">{place(event)}</span>}
        </span>
      </span>
      {event.price_info && <span className="erow-price">{event.price_info}</span>}
    </Link>
  );
}
