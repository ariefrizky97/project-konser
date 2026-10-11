"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { requireAdmin } from "@/lib/auth";
import { FREQUENCIES, isFrequency } from "@/lib/backup";
import { query } from "@/lib/db";

/** Simpan jadwal pengingat cadangan: mati, harian, mingguan, bulanan, atau tahunan. */
export async function saveBackupReminder(formData: FormData): Promise<void> {
  await requireAdmin();
  const value = String(formData.get("frekuensi") ?? "");
  if (!isFrequency(value)) redirect("/admin/cadangan?galat=frekuensi#pengingat");
  await query(
    `INSERT INTO settings (key, value) VALUES ('backup_frequency', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [value],
  );
  await logActivity(`Mengatur pengingat cadangan: ${FREQUENCIES[value].label.toLowerCase()}`, "/admin/cadangan");
  redirect("/admin/cadangan?ok=pengingat#pengingat");
}

/** "Ingatkan besok": sembunyikan pengingat selama 24 jam di browser ini, lalu kembali ke halaman tadi. */
export async function snoozeBackup(): Promise<void> {
  await requireAdmin();
  const store = await cookies();
  store.set("cadangan_tunda", String(Date.now() + 24 * 60 * 60 * 1000), {
    path: "/admin",
    maxAge: 24 * 60 * 60,
    httpOnly: true,
    sameSite: "lax",
  });
  let back = "/admin";
  try {
    const referer = new URL((await headers()).get("referer") ?? "");
    if (/^\/admin(\/[\w\-/]*)?$/.test(referer.pathname)) back = referer.pathname;
  } catch {
    // Tanpa referer: kembali ke dasbor.
  }
  redirect(back);
}
