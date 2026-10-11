"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { bool, choice, int, longText, text, uniqueSlug } from "@/lib/form";
import { slugify } from "@/lib/format";

export async function savePage(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  const backTo = id ? `/admin/halaman/${id}` : "/admin/halaman/baru";
  const title = text(formData, "title", 160);
  if (!title) redirect(`${backTo}?galat=judul`);

  const slug = await uniqueSlug("pages", slugify(text(formData, "slug", 100) || title) || "halaman", id);
  const values = [
    title,
    slug,
    longText(formData, "body", 60_000),
    choice(formData, "status", ["draft", "published"] as const, "draft"),
    bool(formData, "in_footer"),
  ];
  if (id) {
    await query(
      "UPDATE pages SET title = $1, slug = $2, body = $3, status = $4, in_footer = $5, updated_at = now() WHERE id = $6",
      [...values, id],
    );
  } else {
    await query("INSERT INTO pages (title, slug, body, status, in_footer) VALUES ($1, $2, $3, $4, $5)", values);
  }
  await logActivity(`Menyimpan halaman "${title}"`, "/admin/halaman");
  revalidatePath("/", "layout");
  redirect("/admin/halaman?ok=tersimpan");
}

export async function deletePage(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  if (id) {
    const gone = await one<{ title: string }>("DELETE FROM pages WHERE id = $1 RETURNING title", [id]);
    if (gone) await logActivity(`Menghapus halaman "${gone.title}"`);
  }
  revalidatePath("/", "layout");
  redirect("/admin/halaman?ok=terhapus");
}
