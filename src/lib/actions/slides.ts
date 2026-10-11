"use server";

import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { bool, choice, int, text } from "@/lib/form";
import { normalizeUrl } from "@/lib/format";
import { SLIDE_KINDS } from "@/lib/types";
import { youtubeId, youtubeWatchUrl } from "@/lib/youtube";

export async function saveSlide(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  const backTo = id ? `/admin/slide/${id}` : "/admin/slide/baru";

  const title = text(formData, "title", 120);
  if (!title) redirect(`${backTo}?galat=judul`);

  const kind = choice(formData, "kind", SLIDE_KINDS, "photo");
  const videoId = youtubeId(text(formData, "video_url", 300));
  if (kind === "video" && !videoId) redirect(`${backTo}?galat=youtube`);

  const sortValue = Number(text(formData, "sort", 4));
  const values = [
    kind,
    title,
    text(formData, "caption", 200),
    normalizeUrl(text(formData, "image_url", 500)),
    kind === "video" && videoId ? youtubeWatchUrl(videoId) : "",
    normalizeUrl(text(formData, "link_url", 500)),
    Number.isFinite(sortValue) ? Math.trunc(sortValue) : 0,
    bool(formData, "active"),
  ];

  if (id) {
    await query(
      `UPDATE slides
          SET kind = $1, title = $2, caption = $3, image_url = $4, video_url = $5,
              link_url = $6, sort = $7, active = $8, updated_at = now()
        WHERE id = $9`,
      [...values, id],
    );
  } else {
    await query(
      `INSERT INTO slides (kind, title, caption, image_url, video_url, link_url, sort, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      values,
    );
  }

  await logActivity("Menyimpan slide", "/admin/slide");
  revalidatePath("/", "layout");
  redirect("/admin/slide?ok=tersimpan");
}

/** Tampilkan atau sembunyikan slide langsung dari daftar. */
export async function toggleSlide(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  if (id) await query("UPDATE slides SET active = NOT active, updated_at = now() WHERE id = $1", [id]);
  await logActivity("Menyalakan atau mematikan slide", "/admin/slide");
  revalidatePath("/", "layout");
  redirect("/admin/slide?ok=tersimpan");
}

export async function deleteSlide(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  if (id) await query("DELETE FROM slides WHERE id = $1", [id]);
  await logActivity("Menghapus slide");
  revalidatePath("/", "layout");
  redirect("/admin/slide?ok=terhapus");
}
