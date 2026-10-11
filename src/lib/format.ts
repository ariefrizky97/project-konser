import type { CSSProperties } from "react";

// Semua tanggal ditampilkan dan dimasukkan dalam Waktu Indonesia Barat.
export const TIME_ZONE = "Asia/Jakarta";
const WIB_OFFSET = "+07:00";
const LOCALE = "id-ID";

function fmt(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options });
}

const fmtLong = fmt({ day: "numeric", month: "long", year: "numeric" });
const fmtFull = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtShort = fmt({ day: "numeric", month: "short" });
const fmtTime = fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const fmtDay = fmt({ day: "2-digit" });
const fmtMonthShort = fmt({ month: "short" });
const fmtWeekdayShort = fmt({ weekday: "short" });
const fmtMonthYear = fmt({ month: "long", year: "numeric" });
const fmtParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "7 Oktober 2026" */
export function formatDate(date: Date): string {
  return fmtLong.format(date);
}

/** "Rabu, 7 Oktober 2026" */
export function formatDateFull(date: Date): string {
  return fmtFull.format(date);
}

/** "19.30" */
export function formatTime(date: Date): string {
  return fmtTime.format(date).replace(":", ".");
}

/** "7 Oktober 2026 pukul 19.30 WIB" */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} pukul ${formatTime(date)} WIB`;
}

/** Pecahan tanggal untuk blok tanggal pada kartu event. */
export function dateBlock(date: Date): { day: string; month: string; weekday: string } {
  return {
    day: fmtDay.format(date),
    month: fmtMonthShort.format(date).replace(".", ""),
    weekday: fmtWeekdayShort.format(date).replace(".", ""),
  };
}

/** "Oktober 2026" */
export function formatMonthYear(date: Date): string {
  return fmtMonthYear.format(date);
}

/** Kunci tanggal WIB, "2026-10-07". Dipakai untuk membandingkan hari. */
export function dayKey(date: Date): string {
  return toInputValue(date).slice(0, 10);
}

/** Rentang tanggal event, misalnya "16 – 18 Okt 2026" atau "7 Okt 2026, 19.30 WIB". */
export function formatEventRange(start: Date, end: Date | null, allDay: boolean): string {
  const year = fmt({ year: "numeric" }).format(start);
  const sameDay = !end || dayKey(start) === dayKey(end);
  if (sameDay) {
    const base = `${fmtShort.format(start)} ${year}`;
    return allDay ? base : `${base}, ${formatTime(start)} WIB`;
  }
  const endYear = fmt({ year: "numeric" }).format(end);
  if (year === endYear) {
    return `${fmtShort.format(start)} – ${fmtShort.format(end)} ${year}`;
  }
  return `${fmtShort.format(start)} ${year} – ${fmtShort.format(end)} ${endYear}`;
}

/** Waktu relatif singkat: "baru saja", "3 jam lalu", "2 hari lalu", lalu tanggal. */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(date);
}

/** Ubah Date menjadi nilai <input type="datetime-local"> dalam WIB. */
export function toInputValue(date: Date | null): string {
  if (!date) return "";
  const parts: Record<string, string> = {};
  for (const part of fmtParts.formatToParts(date)) parts[part.type] = part.value;
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Baca nilai <input type="datetime-local"> sebagai waktu WIB. Null bila kosong atau tidak sah. */
export function fromInputValue(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) return null;
  const date = new Date(`${trimmed.slice(0, 16)}:00${WIB_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Awal bulan (WIB) dari kunci "2026-10", beserta awal bulan berikutnya. */
export function monthBounds(key: string): { start: Date; end: Date } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = new Date(`${year}-${pad(month)}-01T00:00:00${WIB_OFFSET}`);
  const next = month === 12 ? `${year + 1}-01` : `${year}-${pad(month + 1)}`;
  const end = new Date(`${next}-01T00:00:00${WIB_OFFSET}`);
  return { start, end };
}

/** Kunci bulan WIB, "2026-10". */
export function monthKey(date: Date): string {
  return toInputValue(date).slice(0, 7);
}

/** Ubah judul menjadi slug URL: huruf kecil, angka, dan tanda hubung. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
}

/** Ukuran file yang mudah dibaca: "340 KB", "1,2 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Hanya izinkan tautan http(s), mailto, tel, atau jalur internal. Selain itu dikosongkan. */
export function safeUrl(value: string): string {
  const url = value.trim();
  if (!url) return "";
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
  return "";
}

/** Tambahkan https:// bila pengguna mengetik alamat tanpa skema. */
export function normalizeUrl(value: string): string {
  const url = value.trim();
  if (!url) return "";
  if (url.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(url)) return safeUrl(url);
  return safeUrl(`https://${url}`);
}

/** Estimasi waktu baca dalam menit, minimal 1. */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Ambil satu nilai dari parameter URL yang bisa berupa teks, daftar, atau kosong. */
export function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** Nomor halaman dari parameter URL, minimal 1. */
export function pageNumber(value: string | string[] | undefined): number {
  const number = Number.parseInt(param(value), 10);
  return Number.isFinite(number) && number > 0 ? Math.min(number, 10_000) : 1;
}

/** Decode bagian alamat tanpa melempar galat bila bentuknya rusak. */
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Warna label (kategori, tipe event) sebagai variabel CSS. `--tone` adalah warna
 * pilihan admin, `--on-tone` warna teks yang terbaca di atasnya (gelap atau terang).
 * Mengembalikan undefined bila warnanya kosong, sehingga label memakai warna bawaan.
 */
export function toneStyle(color: string | null | undefined): CSSProperties | undefined {
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return undefined;
  const channel = (offset: number) => {
    const value = Number.parseInt(color.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return { "--tone": color, "--on-tone": luminance > 0.36 ? "#17140e" : "#fffbf0" } as CSSProperties;
}

/** Waktu relatif untuk umur berapa pun: "baru saja", "12 menit lalu", "3 minggu lalu", "2 tahun lalu". */
export function relativeTime(date: Date, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
  return `${Math.floor(days / 365)} tahun lalu`;
}
