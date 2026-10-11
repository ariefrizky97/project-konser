import { one } from "./db";

/** Ambil teks dari form: dipangkas dan dibatasi panjangnya. */
export function text(form: FormData, key: string, max = 500): string {
  const value = form.get(key);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

/** Teks panjang (isi artikel). Baris baru dipertahankan. */
export function longText(form: FormData, key: string, max = 100_000): string {
  const value = form.get(key);
  if (typeof value !== "string") return "";
  return value.replace(/\r\n?/g, "\n").trim().slice(0, max);
}

export function bool(form: FormData, key: string): boolean {
  const value = form.get(key);
  return value === "on" || value === "true" || value === "1";
}

/** Bilangan bulat positif, atau null bila kosong atau tidak sah. */
export function int(form: FormData, key: string): number | null {
  const value = form.get(key);
  if (typeof value !== "string" || !/^\d{1,9}$/.test(value.trim())) return null;
  const number = Number(value.trim());
  return number > 0 ? number : null;
}

/** Pilih salah satu nilai yang diizinkan; selain itu pakai nilai bawaan. */
export function choice<T extends string>(
  form: FormData,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = form.get(key);
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

type SlugTable = "posts" | "events" | "directory_entries" | "categories" | "event_types" | "pages";

/**
 * Pastikan slug belum dipakai di tabel. Bila sudah, tambahkan -2, -3, dan seterusnya.
 * Nama tabel berasal dari daftar tetap di atas, bukan dari masukan pengguna.
 */
export async function uniqueSlug(
  table: SlugTable,
  base: string,
  excludeId: number | null,
): Promise<string> {
  let candidate = base;
  for (let suffix = 2; suffix < 200; suffix += 1) {
    const clash = await one<{ id: number }>(
      `SELECT id FROM ${table} WHERE slug = $1 AND id <> $2 LIMIT 1`,
      [candidate, excludeId ?? 0],
    );
    if (!clash) return candidate;
    candidate = `${base}-${suffix}`;
  }
  return `${base}-${Date.now()}`;
}

export type ParsedTag = { name: string; slug: string };

/**
 * Baca isian tagar. Tagar dipisah koma, spasi, atau baris baru; tanda # boleh ada atau tidak.
 * Hanya huruf, angka, dan garis bawah yang dipertahankan. Paling banyak 12 tagar.
 */
export function parseTags(input: string): ParsedTag[] {
  const seen = new Set<string>();
  const tags: ParsedTag[] = [];
  for (const token of input.split(/[\s,]+/)) {
    const name = token.replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 40);
    const slug = name.toLowerCase();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    tags.push({ name, slug });
    if (tags.length === 12) break;
  }
  return tags;
}
