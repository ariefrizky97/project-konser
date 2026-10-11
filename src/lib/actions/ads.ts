"use server";

import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { bool, choice, int, text } from "@/lib/form";
import { fromInputValue, normalizeUrl } from "@/lib/format";
import { AD_SLOTS, AD_TEMPLATES, AD_TONES } from "@/lib/types";

export async function saveAd(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  const backTo = id ? `/admin/iklan/${id}` : "/admin/iklan/baru";

  const name = text(formData, "name", 120);
  if (!name) redirect(`${backTo}?galat=nama`);

  const template = choice(formData, "template", AD_TEMPLATES, "text");
  const imageUrl = normalizeUrl(text(formData, "image_url", 500));
  const headline = text(formData, "headline", 90);
  if (template === "image" && !imageUrl) redirect(`${backTo}?galat=gambar`);
  if (template !== "image" && !headline) redirect(`${backTo}?galat=judul-iklan`);

  const values = [
    name,
    choice(formData, "slot", AD_SLOTS, "header"),
    template,
    choice(formData, "tone", AD_TONES, "sun"),
    headline,
    text(formData, "subline", 140),
    text(formData, "cta_label", 30),
    imageUrl,
    normalizeUrl(text(formData, "target_url", 500)),
    bool(formData, "active"),
    fromInputValue(text(formData, "starts_at", 20)),
    fromInputValue(text(formData, "ends_at", 20)),
  ];

  if (id) {
    await query(
      `UPDATE ads
          SET name = $1, slot = $2, template = $3, tone = $4, headline = $5, subline = $6,
              cta_label = $7, image_url = $8, target_url = $9, active = $10,
              starts_at = $11, ends_at = $12, updated_at = now()
        WHERE id = $13`,
      [...values, id],
    );
  } else {
    await query(
      `INSERT INTO ads
         (name, slot, template, tone, headline, subline, cta_label, image_url, target_url,
          active, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      values,
    );
  }

  await logActivity("Menyimpan iklan", "/admin/iklan");
  revalidatePath("/", "layout");
  redirect("/admin/iklan?ok=tersimpan");
}

/** Nyalakan atau matikan iklan langsung dari daftar. */
export async function toggleAd(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  if (id) await query("UPDATE ads SET active = NOT active, updated_at = now() WHERE id = $1", [id]);
  await logActivity("Menyalakan atau mematikan iklan", "/admin/iklan");
  revalidatePath("/", "layout");
  redirect("/admin/iklan?ok=tersimpan");
}

export async function deleteAd(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  if (id) await query("DELETE FROM ads WHERE id = $1", [id]);
  await logActivity("Menghapus iklan");
  revalidatePath("/", "layout");
  redirect("/admin/iklan?ok=terhapus");
}
