"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { longText, text } from "@/lib/form";
import { normalizeUrl } from "@/lib/format";
import type { Settings } from "@/lib/types";

export async function saveSettings(formData: FormData): Promise<void> {
  await requireAdmin();

  const siteName = text(formData, "site_name", 60);
  if (!siteName) redirect("/admin/pengaturan?galat=nama");

  const values: Settings = {
    site_name: siteName,
    tagline: text(formData, "tagline", 120),
    description: text(formData, "description", 300),
    about: longText(formData, "about", 20_000),
    contact_email: text(formData, "contact_email", 160),
    instagram: normalizeUrl(text(formData, "instagram", 300)),
    youtube: normalizeUrl(text(formData, "youtube", 300)),
    tiktok: normalizeUrl(text(formData, "tiktok", 300)),
    threads: normalizeUrl(text(formData, "threads", 300)),
    facebook: normalizeUrl(text(formData, "facebook", 300)),
  };

  for (const [key, value] of Object.entries(values)) {
    await query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, value],
    );
  }

  await logActivity("Mengubah pengaturan situs", "/admin/pengaturan");
  revalidatePath("/", "layout");
  redirect("/admin/pengaturan?ok=tersimpan");
}
