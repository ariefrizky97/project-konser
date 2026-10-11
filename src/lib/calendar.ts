import { dayKey } from "./format";
import { stripMarkdown } from "./markdown";
import type { EventItem } from "./types";

const SIX_HOURS = 6 * 60 * 60 * 1000;

/** 2026-10-16T12:30:00.000Z menjadi 20261016T123000Z */
function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Kunci hari WIB tanpa tanda hubung, digeser sekian hari. */
function dayStamp(date: Date, addDays = 0): string {
  const shifted = new Date(`${dayKey(date)}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + addDays);
  return shifted.toISOString().slice(0, 10).replace(/-/g, "");
}

function location(event: EventItem): string {
  return [event.venue_name, event.address || event.city].filter(Boolean).join(", ");
}

/** Rentang waktu event. Event sepanjang hari memakai tanggal saja, dengan akhir eksklusif. */
function range(event: EventItem): { start: string; end: string; allDay: boolean } {
  if (event.all_day) {
    return {
      start: dayStamp(event.starts_at),
      end: dayStamp(event.ends_at ?? event.starts_at, 1),
      allDay: true,
    };
  }
  const end = event.ends_at ?? new Date(event.starts_at.getTime() + SIX_HOURS);
  return { start: utcStamp(event.starts_at), end: utcStamp(end), allDay: false };
}

/** Tautan "Tambah ke Google Calendar". */
export function googleCalendarUrl(event: EventItem, pageUrl: string): string {
  const { start, end } = range(event);
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: `${event.summary}\n\n${pageUrl}`.trim(),
    location: location(event),
    ctz: "Asia/Jakarta",
  });
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Baris iCalendar dilipat setiap 74 karakter sesuai RFC 5545.
function fold(line: string): string {
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    chunks.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  chunks.push(rest);
  return chunks.join("\r\n");
}

/** Isi file .ics untuk satu event. */
export function icsFile(event: EventItem, pageUrl: string, siteName: string): string {
  const { start, end, allDay } = range(event);
  const host = new URL(pageUrl).host;
  const description = [event.summary, stripMarkdown(event.description), pageUrl]
    .filter(Boolean)
    .join("\n\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${escapeText(siteName)}//Agenda//ID`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:event-${event.id}@${host}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
    allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(location(event))}`,
    `URL:${pageUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

/** Tautan pencarian Google Maps untuk tempat event. */
export function mapsUrl(venue: string, address: string, city: string): string {
  const query = [venue, address || city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
