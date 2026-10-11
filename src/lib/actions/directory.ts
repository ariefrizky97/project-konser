"use server";

import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { choice, int, longText, text, uniqueSlug } from "@/lib/form";
import { normalizeUrl, slugify } from "@/lib/format";
import { makeExcerpt } from "@/lib/markdown";
import { DIRECTORY_KINDS } from "@/lib/types";

export async function saveDirectoryEntry(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  const backTo = id ? `/admin/direktori/${id}` : "/admin/direktori/baru";

  const name = text(formData, "name", 160);
  if (!name) redirect(`${backTo}?galat=nama`);

  const description = longText(formData, "description", 20_000);
  const slug = await uniqueSlug(
    "directory_entries",
    slugify(text(formData, "slug", 120) || name) || "entri",
    id,
  );
  // Nama akun Instagram disimpan tanpa @ dan tanpa alamat lengkap.
  const instagram = text(formData, "instagram", 80)
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?].*$/, "");

  const values = [
    choice(formData, "kind", DIRECTORY_KINDS, "venue"),
    name,
    slug,
    text(formData, "summary", 300) || makeExcerpt(description, 160),
    description,
    text(formData, "city", 80),
    text(formData, "address", 300),
    text(formData, "contact", 160),
    normalizeUrl(text(formData, "website", 500)),
    instagram,
    normalizeUrl(text(formData, "cover_url", 500)) || null,
    choice(formData, "status", ["draft", "published"] as const, "draft"),
  ];

  if (id) {
    await query(
      `UPDATE directory_entries
          SET kind = $1, name = $2, slug = $3, summary = $4, description = $5, city = $6,
              address = $7, contact = $8, website = $9, instagram = $10, cover_url = $11,
              status = $12, updated_at = now()
        WHERE id = $13`,
      [...values, id],
    );
  } else {
    await query(
      `INSERT INTO directory_entries
         (kind, name, slug, summary, description, city, address, contact, website, instagram,
          cover_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      values,
    );
  }

  await logActivity("Menyimpan entri direktori", "/admin/direktori");
  revalidatePath("/", "layout");
  redirect("/admin/direktori?ok=tersimpan");
}

export async function deleteDirectoryEntry(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  if (id) await query("DELETE FROM directory_entries WHERE id = $1", [id]);
  await logActivity("Menghapus entri direktori");
  revalidatePath("/", "layout");
  redirect("/admin/direktori?ok=terhapus");
}
