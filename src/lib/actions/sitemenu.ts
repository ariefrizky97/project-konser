"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { choice } from "@/lib/form";
import { cleanLinks } from "@/lib/sitemenu";

function json(formData: FormData, key: string): unknown {
  const value = formData.get(key);
  if (typeof value !== "string" || value.length > 20_000) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Simpan urutan menu navbar dan pengaturan teks berjalan. */
export async function saveSiteMenu(formData: FormData): Promise<void> {
  await requireAdmin();
  const nav = cleanLinks(json(formData, "nav_items"), 10).filter((link) => link.href);
  if (!nav.length) redirect("/admin/menu?galat=menu-kosong");

  const values: Record<string, string> = {
    nav_items: JSON.stringify(nav),
    ticker_mode: choice(formData, "ticker_mode", ["auto", "manual"] as const, "auto"),
    ticker_items: JSON.stringify(cleanLinks(json(formData, "ticker_items"), 12)),
    ticker_speed: choice(formData, "ticker_speed", ["pelan", "sedang", "cepat"] as const, "sedang"),
  };
  for (const [key, value] of Object.entries(values)) {
    await query(
      "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [key, value],
    );
  }
  await logActivity("Mengubah menu navbar dan teks berjalan", "/admin/menu");
  revalidatePath("/", "layout");
  redirect("/admin/menu?ok=tersimpan");
}
