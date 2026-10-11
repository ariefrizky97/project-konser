"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { bool, choice, int, longText, parseTags, text, uniqueSlug } from "@/lib/form";
import { fromInputValue, normalizeUrl, slugify } from "@/lib/format";
import { makeExcerpt } from "@/lib/markdown";
import { youtubeId, youtubeWatchUrl } from "@/lib/youtube";

/** Ganti seluruh tagar sebuah artikel, lalu buang tagar yang tidak dipakai lagi. */
async function setPostTags(postId: number, input: string): Promise<void> {
  await query("DELETE FROM post_tags WHERE post_id = $1", [postId]);
  for (const tag of parseTags(input)) {
    const row = await one<{ id: number }>(
      `INSERT INTO tags (name, slug) VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
       RETURNING id`,
      [tag.name, tag.slug],
    );
    if (row) {
      await query(
        "INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [postId, row.id],
      );
    }
  }
  await pruneTags();
}

async function pruneTags(): Promise<void> {
  await query("DELETE FROM tags t WHERE NOT EXISTS (SELECT 1 FROM post_tags pt WHERE pt.tag_id = t.id)");
}

export async function savePost(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = int(formData, "id");
  const backTo = id ? `/admin/berita/${id}` : "/admin/berita/baru";

  const title = text(formData, "title", 200);
  if (!title) redirect(`${backTo}?galat=judul`);

  const body = longText(formData, "body");
  const excerpt = text(formData, "excerpt", 300) || makeExcerpt(body, 180);
  const slug = await uniqueSlug(
    "posts",
    slugify(text(formData, "slug", 120) || title) || "artikel",
    id,
  );
  // Penulis (editor) tidak bisa menerbitkan sendiri: pilihan "terbit" menjadi "menunggu tinjauan".
  const wanted = choice(formData, "status", ["draft", "review", "published"] as const, "draft");
  const status = wanted === "published" && user.role !== "admin" ? "review" : wanted;
  const seoTitle = text(formData, "seo_title", 70);
  const seoDescription = text(formData, "seo_description", 170);
  const reviewNote = text(formData, "review_note", 500);
  const coverUrl = normalizeUrl(text(formData, "cover_url", 500)) || null;
  const categoryId = int(formData, "category_id");

  // Video hanya menerima tautan YouTube. Tautan lain ditolak supaya tidak tersimpan diam-diam.
  const videoInput = text(formData, "video_url", 300);
  const videoId = videoInput ? youtubeId(videoInput) : null;
  if (videoInput && !videoId) redirect(`${backTo}?galat=youtube`);
  const videoUrl = videoId ? youtubeWatchUrl(videoId) : "";
  const featured = bool(formData, "featured");

  // Artikel terbit tanpa waktu terbit langsung tayang sekarang.
  // Waktu terbit di masa depan membuat artikel terjadwal.
  const requested = fromInputValue(text(formData, "published_at", 20));
  const publishedAt = status === "published" ? (requested ?? new Date()) : requested;

  let postId = id;
  if (id) {
    await keepRevision(id, user, { title, excerpt, body });
    await query(
      `UPDATE posts
          SET title = $1, slug = $2, excerpt = $3, body = $4, cover_url = $5,
              category_id = $6, status = $7, featured = $8, published_at = $9,
              video_url = $10, seo_title = $11, seo_description = $12, review_note = $13,
              updated_at = now()
        WHERE id = $14`,
      [title, slug, excerpt, body, coverUrl, categoryId, status, featured, publishedAt, videoUrl,
       seoTitle, seoDescription, reviewNote, id],
    );
  } else {
    const row = await one<{ id: number }>(
      `INSERT INTO posts
         (title, slug, excerpt, body, cover_url, category_id, status, featured, published_at,
          video_url, seo_title, seo_description, review_note, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [title, slug, excerpt, body, coverUrl, categoryId, status, featured, publishedAt, videoUrl,
       seoTitle, seoDescription, reviewNote, user.id],
    );
    postId = row?.id ?? null;
  }
  if (postId) await setPostTags(postId, text(formData, "tags", 600));

  const verb = status === "published" ? "Menerbitkan" : status === "review" ? "Mengajukan tinjauan" : "Menyimpan draf";
  await logActivity(`${verb} artikel "${title}"`, postId ? `/admin/berita/${postId}` : "");

  revalidatePath("/", "layout");
  redirect(`/admin/berita?ok=${wanted === "published" && status === "review" ? "diajukan" : "tersimpan"}`);
}

/**
 * Simpan versi artikel yang sekarang sebelum ditimpa, bila judul, ringkasan, atau isinya berubah.
 * Hanya 20 versi terakhir yang disimpan per artikel.
 */
async function keepRevision(
  postId: number,
  user: { id: number; name: string },
  next: { title: string; excerpt: string; body: string },
): Promise<void> {
  const current = await one<{ title: string; excerpt: string; body: string }>(
    "SELECT title, excerpt, body FROM posts WHERE id = $1",
    [postId],
  );
  if (!current) return;
  const changed = [
    current.title !== next.title && "judul",
    current.excerpt !== next.excerpt && "ringkasan",
    current.body !== next.body && "isi",
  ].filter(Boolean);
  if (!changed.length) return;
  await query(
    `INSERT INTO post_revisions (post_id, user_id, user_name, title, excerpt, body, summary)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [postId, user.id, user.name, current.title, current.excerpt, current.body, `mengubah ${changed.join(", ")}`],
  );
  await query(
    `DELETE FROM post_revisions WHERE post_id = $1
        AND id NOT IN (SELECT id FROM post_revisions WHERE post_id = $1 ORDER BY id DESC LIMIT 20)`,
    [postId],
  );
}

/** Kembalikan judul, ringkasan, dan isi artikel ke satu versi lama. Versi sekarang ikut disimpan. */
export async function restoreRevision(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = int(formData, "revision_id");
  const revision = id
    ? await one<{ post_id: number; title: string; excerpt: string; body: string }>(
        "SELECT post_id, title, excerpt, body FROM post_revisions WHERE id = $1",
        [id],
      )
    : null;
  if (!revision) redirect("/admin/berita");
  await keepRevision(revision.post_id, user, revision);
  await query("UPDATE posts SET title = $1, excerpt = $2, body = $3, updated_at = now() WHERE id = $4", [
    revision.title,
    revision.excerpt,
    revision.body,
    revision.post_id,
  ]);
  await logActivity(`Mengembalikan versi lama artikel "${revision.title}"`, `/admin/berita/${revision.post_id}`);
  revalidatePath("/", "layout");
  redirect(`/admin/berita/${revision.post_id}?ok=dikembalikan`);
}

/** Buat (atau ganti) tautan pratinjau draf. Tautan lama langsung tidak berlaku. */
export async function makePreviewLink(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  if (!id) redirect("/admin/berita");
  const token = bool(formData, "hapus") ? "" : randomBytes(12).toString("hex");
  await query("UPDATE posts SET preview_token = $1 WHERE id = $2", [token, id]);
  redirect(`/admin/berita/${id}?ok=${token ? "pratinjau" : "pratinjau-hapus"}`);
}

export async function deletePost(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  if (id) {
    const gone = await one<{ title: string }>("DELETE FROM posts WHERE id = $1 RETURNING title", [id]);
    await pruneTags();
    if (gone) await logActivity(`Menghapus artikel "${gone.title}"`);
  }
  revalidatePath("/", "layout");
  redirect("/admin/berita?ok=terhapus");
}
