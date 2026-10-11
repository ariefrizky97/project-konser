import { cache } from "react";
import { query } from "./db";
import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  site_name: "Project Konser",
  tagline: "Kabar Berita, Konser dan Musik",
  description:
    "Portal kabar konser, musik, film, dan agenda event. Cari tahu apa yang ramai minggu ini dan ke mana harus pergi.",
  about: "",
  contact_email: "",
  instagram: "https://www.instagram.com/projectkonser",
  youtube: "https://www.youtube.com/@projectkonser",
  tiktok: "https://www.tiktok.com/@projectkonser",
  threads: "https://www.threads.com/@projectkonser",
  facebook: "",
};

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

/** Pengaturan situs. Nilai yang belum diisi memakai bawaan. */
export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
  const settings: Settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if ((SETTING_KEYS as string[]).includes(row.key) && row.value !== "") {
      settings[row.key as keyof Settings] = row.value;
    }
  }
  return settings;
});

/** Alamat dasar situs tanpa garis miring di akhir. */
export function siteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}
