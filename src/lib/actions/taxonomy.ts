"use server";

import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { choice, int, text, uniqueSlug } from "@/lib/form";
import { slugify } from "@/lib/format";
import { clearYoutubeCache, parseYoutubeSource } from "@/lib/ytlist";

const TABLES = ["categories", "event_types"] as const;

/** Tambah atau ubah kategori berita maupun tipe event. */
export async function saveTaxonomy(formData: FormData): Promise<void> {
  await requireUser();
  const table = choice(formData, "table", TABLES, "categories");
  const id = int(formData, "id");
  const name = text(formData, "name", 80);
  if (!name) redirect("/admin/kategori?galat=nama");

  const sortValue = Number(text(formData, "sort", 4));
  const sort = Number.isFinite(sortValue) ? Math.trunc(sortValue) : 0;
  // Warna label hanya diterima dalam bentuk #RRGGBB.
  const colorInput = text(formData, "color", 7);
  const color = /^#[0-9a-fA-F]{6}$/.test(colorInput) ? colorInput.toLowerCase() : "";

  if (table === "categories" && formData.has("youtube")) {
    // Video YouTube untuk blok kategori di beranda: satu playlist/kanal, atau beberapa video.
    const raw = String(formData.get("youtube") ?? "").slice(0, 4000);
    const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const off = lines.length === 1 && lines[0].toLowerCase() === "mati";
    const source = parseYoutubeSource(off ? "" : lines.join("\n"));
    if (source.invalid.length) redirect("/admin/kategori?galat=youtube-baris");
    if ((source.playlist || source.channel) && (source.videos.length || lines.length > 1)) redirect("/admin/kategori?galat=youtube-campur");
    if (source.videos.length > 15) redirect("/admin/kategori?galat=youtube-banyak");
    const title = text(formData, "youtube_title", 80);
    if (id) await query("UPDATE categories SET youtube = $1, youtube_title = $2 WHERE id = $3", [lines.join("\n"), title, id]);
    clearYoutubeCache();
  }

  if (id) {
    await query(`UPDATE ${table} SET name = $1, sort = $2, color = $3 WHERE id = $4`, [name, sort, color, id]);
  } else {
    const slug = await uniqueSlug(table, slugify(name) || "kategori", null);
    await query(`INSERT INTO ${table} (name, slug, sort, color) VALUES ($1, $2, $3, $4)`, [name, slug, sort, color]);
  }

  await logActivity("Menyimpan kategori atau tipe event", "/admin/kategori");
  revalidatePath("/", "layout");
  redirect("/admin/kategori?ok=tersimpan");
}

export async function deleteTaxonomy(formData: FormData): Promise<void> {
  await requireUser();
  const table = choice(formData, "table", TABLES, "categories");
  const id = int(formData, "id");
  if (id) await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  await logActivity("Menghapus kategori atau tipe event");
  revalidatePath("/", "layout");
  redirect("/admin/kategori?ok=terhapus");
}

/** Ambil ulang semua daftar video YouTube sekarang (tanpa menunggu simpanan satu jam habis). */
export async function refreshYoutube(): Promise<void> {
  await requireUser();
  clearYoutubeCache();
  revalidatePath("/", "layout");
  redirect("/admin/kategori?ok=youtube");
}
