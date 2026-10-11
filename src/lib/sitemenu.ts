import { cache } from "react";
import { query } from "./db";
import { safeUrl } from "./format";

// Menu navbar dan isi teks berjalan disimpan sebagai JSON di tabel settings,
// diatur dari Admin > Menu & teks berjalan.

export type MenuLink = { label: string; href: string };
export type TickerLine = { text: string; href: string };
export type TickerSpeed = "pelan" | "sedang" | "cepat";
export type SiteMenu = {
  nav: MenuLink[];
  tickerMode: "auto" | "manual";
  tickerItems: TickerLine[];
  tickerSpeed: TickerSpeed;
};

export const DEFAULT_NAV: MenuLink[] = [
  { label: "Beranda", href: "/" },
  { label: "Berita", href: "/berita" },
  { label: "Agenda", href: "/event" },
  { label: "Direktori", href: "/direktori" },
  { label: "Tentang", href: "/tentang" },
];

export const TICKER_SECONDS: Record<TickerSpeed, number> = { pelan: 130, sedang: 90, cepat: 55 };

/** Bersihkan daftar tautan dari masukan: label wajib, alamat hanya internal atau http(s). */
export function cleanLinks(input: unknown, max: number): MenuLink[] {
  if (!Array.isArray(input)) return [];
  const links: MenuLink[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const label = String(raw.label ?? raw.text ?? "").trim().slice(0, 160);
    const href = safeUrl(String(raw.href ?? "").trim().slice(0, 300));
    if (!label) continue;
    links.push({ label, href: /^(mailto:|tel:)/i.test(href) ? "" : href });
    if (links.length >= max) break;
  }
  return links;
}

function parse(value: string | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export const getSiteMenu = cache(async (): Promise<SiteMenu> => {
  const rows = await query<{ key: string; value: string }>(
    "SELECT key, value FROM settings WHERE key IN ('nav_items', 'ticker_mode', 'ticker_items', 'ticker_speed')",
  );
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const nav = cleanLinks(parse(map.nav_items), 10).filter((link) => link.href);
  const speed = map.ticker_speed;
  return {
    nav: nav.length ? nav : DEFAULT_NAV,
    tickerMode: map.ticker_mode === "manual" ? "manual" : "auto",
    tickerItems: cleanLinks(parse(map.ticker_items), 12).map((link) => ({ text: link.label, href: link.href })),
    tickerSpeed: speed === "pelan" || speed === "cepat" ? speed : "sedang",
  };
});
