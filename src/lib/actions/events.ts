"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { bool, choice, int, longText, text, uniqueSlug } from "@/lib/form";
import { fromInputValue, normalizeUrl, slugify } from "@/lib/format";
import { makeExcerpt } from "@/lib/markdown";

export async function saveEvent(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  const backTo = id ? `/admin/event/${id}` : "/admin/event/baru";

  const title = text(formData, "title", 200);
  if (!title) redirect(`${backTo}?galat=judul`);

  const startsAt = fromInputValue(text(formData, "starts_at", 20));
  if (!startsAt) redirect(`${backTo}?galat=tanggal`);

  // Waktu selesai yang lebih awal dari waktu mulai diabaikan.
  let endsAt = fromInputValue(text(formData, "ends_at", 20));
  let note = "";
  if (endsAt && endsAt.getTime() < startsAt.getTime()) {
    endsAt = null;
    note = "&catatan=selesai";
  }

  const description = longText(formData, "description", 20_000);
  const summary = text(formData, "summary", 300) || makeExcerpt(description, 160);
  const slug = await uniqueSlug(
    "events",
    slugify(text(formData, "slug", 120) || title) || "event",
    id,
  );
  const values = [
    title,
    slug,
    summary,
    description,
    normalizeUrl(text(formData, "cover_url", 500)) || null,
    int(formData, "type_id"),
    startsAt,
    endsAt,
    bool(formData, "all_day"),
    text(formData, "venue_name", 160),
    text(formData, "city", 80),
    text(formData, "address", 300),
    text(formData, "price_info", 200),
    normalizeUrl(text(formData, "ticket_url", 500)),
    text(formData, "organizer_name", 160),
    choice(formData, "status", ["draft", "published"] as const, "draft"),
  ];

  if (id) {
    await query(
      `UPDATE events
          SET title = $1, slug = $2, summary = $3, description = $4, cover_url = $5,
              type_id = $6, starts_at = $7, ends_at = $8, all_day = $9, venue_name = $10,
              city = $11, address = $12, price_info = $13, ticket_url = $14,
              organizer_name = $15, status = $16, updated_at = now()
        WHERE id = $17`,
      [...values, id],
    );
  } else {
    await query(
      `INSERT INTO events
         (title, slug, summary, description, cover_url, type_id, starts_at, ends_at, all_day,
          venue_name, city, address, price_info, ticket_url, organizer_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      values,
    );
  }

  await logActivity(`Menyimpan event "${title}"`, id ? `/admin/event/${id}` : "/admin/event");
  revalidatePath("/", "layout");
  redirect(`/admin/event?ok=tersimpan${note}`);
}

export async function deleteEvent(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  if (id) {
    await query("DELETE FROM events WHERE id = $1", [id]);
    await logActivity("Menghapus satu event");
  }
  revalidatePath("/", "layout");
  redirect("/admin/event?ok=terhapus");
}
