"use client";

import Link from "next/link";
import { useState } from "react";

export type CalendarEvent = {
  id: number;
  title: string;
  slug: string;
  /** Hari mulai dan selesai dalam WIB, bentuk "2026-10-16". */
  start: string;
  end: string;
  place: string;
};

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const pad = (value: number) => String(value).padStart(2, "0");

/** Susun kotak tanggal satu bulan, diawali sel kosong sampai hari pertama. */
function buildMonth(year: number, month: number): (string | null)[] {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const total = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: first }, () => null);
  for (let day = 1; day <= total; day += 1) cells.push(`${year}-${pad(month + 1)}-${pad(day)}`);
  return cells;
}

function dayLabel(key: string): string {
  const [, month, day] = key.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

/**
 * Kalender event bulanan. Tanggal yang punya event diberi tanda; menekan tanggal
 * menampilkan event hari itu, dan panah berpindah bulan.
 */
export function EventCalendar({ events, today }: { events: CalendarEvent[]; today: string }) {
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1);
  const [selected, setSelected] = useState<string | null>(null);

  const cells = buildMonth(year, month);
  const monthKey = `${year}-${pad(month + 1)}`;
  const on = (key: string) => events.filter((event) => event.start <= key && event.end >= key);

  function shift(step: number) {
    const next = new Date(Date.UTC(year, month + step, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth());
    setSelected(null);
  }

  // Tanpa tanggal terpilih, daftar di bawah berisi event bulan yang sedang dibuka.
  const listed = selected
    ? on(selected)
    : events.filter((event) => event.start.slice(0, 7) <= monthKey && event.end.slice(0, 7) >= monthKey);

  return (
    <section className="widget cal" aria-labelledby="w-kalender">
      <h2 className="widget-title" id="w-kalender">
        Kalender event
      </h2>
      <div className="cal-head">
        <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Bulan sebelumnya">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="cal-month" aria-live="polite">
          {MONTHS[month]} {year}
        </p>
        <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Bulan berikutnya">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="cal-grid" role="grid" aria-label={`${MONTHS[month]} ${year}`}>
        {WEEKDAYS.map((name) => (
          <span className="cal-weekday" key={name} role="columnheader">
            {name}
          </span>
        ))}
        {cells.map((key, index) => {
          if (!key) return <span key={`kosong-${index}`} />;
          const count = on(key).length;
          const classes = ["cal-day"];
          if (key === today) classes.push("is-today");
          if (count) classes.push("has-event");
          if (key === selected) classes.push("is-selected");
          const day = Number(key.slice(8));
          return count ? (
            <button
              type="button"
              key={key}
              className={classes.join(" ")}
              onClick={() => setSelected(key === selected ? null : key)}
              aria-pressed={key === selected}
              aria-label={`${dayLabel(key)}, ${count} event`}
            >
              {day}
            </button>
          ) : (
            <span key={key} className={classes.join(" ")}>
              {day}
            </span>
          );
        })}
      </div>

      <p className="cal-caption">
        {selected ? `Event pada ${dayLabel(selected)}` : `Event bulan ${MONTHS[month]}`}
      </p>
      {listed.length === 0 ? (
        <p className="widget-empty">Belum ada event di bulan ini.</p>
      ) : (
        <ul className="cal-list">
          {listed.slice(0, 6).map((event) => (
            <li key={event.id}>
              <Link href={`/event/${event.slug}`}>
                <span className="cal-list-date">
                  {event.start === event.end
                    ? dayLabel(event.start)
                    : `${Number(event.start.slice(8))} sampai ${dayLabel(event.end)}`}
                </span>
                <span className="cal-list-title">{event.title}</span>
                {event.place && <span className="cal-list-place">{event.place}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/event" className="sec-more">
        Semua agenda
      </Link>
    </section>
  );
}
