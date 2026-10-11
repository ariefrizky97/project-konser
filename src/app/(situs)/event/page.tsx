import type { Metadata } from "next";
import Link from "next/link";
import { EventRow } from "@/components/site/EventCard";
import { SectionHead } from "@/components/site/SectionHead";
import { formatMonthYear, monthBounds, monthKey, param } from "@/lib/format";
import { listEventMonths, listEventTypes, listEvents, listPastEvents } from "@/lib/queries";
import { skeletonDelay } from "@/lib/skeleton";
import type { EventItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Agenda event",
  description: "Jadwal konser, festival, pameran, dan acara lain yang akan datang.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function hrefWith(type: string, month: string): string {
  const search = new URLSearchParams();
  if (type) search.set("tipe", type);
  if (month) search.set("bulan", month);
  const text = search.toString();
  return text ? `/event?${text}` : "/event";
}

/** Kelompokkan event menurut bulan mulai (WIB) dengan urutan tetap. */
function groupByMonth(events: EventItem[]): { key: string; label: string; items: EventItem[] }[] {
  const groups: { key: string; label: string; items: EventItem[] }[] = [];
  for (const event of events) {
    const key = monthKey(event.starts_at);
    let group = groups.find((item) => item.key === key);
    if (!group) {
      group = { key, label: formatMonthYear(event.starts_at), items: [] };
      groups.push(group);
    }
    group.items.push(event);
  }
  return groups;
}

export default async function EventsPage({ searchParams }: Props) {
  const query = await searchParams;
  const type = param(query.tipe);
  const month = param(query.bulan);
  const range = month ? monthBounds(month) : null;

  const [types, months, events, past] = await Promise.all([
    listEventTypes(),
    listEventMonths(),
    listEvents({ typeSlug: type || undefined, range: range ?? undefined, limit: 100 }),
    !type && !month ? listPastEvents(4) : Promise.resolve([]),
    skeletonDelay(),
  ]);

  const groups = groupByMonth(events);

  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">Agenda</h1>
        <p className="lede">Konser, festival, pameran, dan acara lain yang akan datang. Waktu dalam WIB.</p>

        <nav className="chips" aria-label="Tipe event">
          <Link href={hrefWith("", month)} className="chip" aria-current={!type ? "page" : undefined}>
            Semua tipe
          </Link>
          {types.map((item) => (
            <Link
              key={item.id}
              href={hrefWith(item.slug, month)}
              className="chip"
              aria-current={item.slug === type ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {months.length > 1 && (
          <nav className="chips" aria-label="Bulan">
            <Link href={hrefWith(type, "")} className="chip" aria-current={!month ? "page" : undefined}>
              Semua bulan
            </Link>
            {months.map((key) => {
              const bounds = monthBounds(key);
              if (!bounds) return null;
              return (
                <Link
                  key={key}
                  href={hrefWith(type, key)}
                  className="chip"
                  aria-current={key === month ? "page" : undefined}
                >
                  {formatMonthYear(bounds.start)}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {groups.length === 0 ? (
        type || month ? (
          <div className="empty">
            <p>Tidak ada event yang cocok dengan pilihan ini.</p>
            <Link href="/event" className="btn btn--line">
              Tampilkan semua event
            </Link>
          </div>
        ) : (
          <p className="empty">Belum ada event mendatang.</p>
        )
      ) : (
        groups.map((group) => (
          <section key={group.key} className="month">
            <h2 className="month-title">{group.label}</h2>
            <div className="erows">
              {group.items.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </section>
        ))
      )}

      {past.length > 0 && (
        <section className="sec sec--past">
          <SectionHead title="Sudah lewat" />
          <div className="erows">
            {past.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
