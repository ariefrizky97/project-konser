"use server";

import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { int, text } from "@/lib/form";

/** Form langganan buletin di kaki situs. Email yang sudah terdaftar tidak digandakan. */
export async function subscribe(formData: FormData): Promise<void> {
  const back = text(formData, "kembali", 200);
  const base = back.startsWith("/") && !back.startsWith("//") ? back.split(/[?#]/)[0] : "/";
  if (text(formData, "situs", 100)) redirect(`${base}?ok=langganan#buletin`);
  const email = text(formData, "email", 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) redirect(`${base}?galat=email#buletin`);
  await query("INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT DO NOTHING", [email]);
  redirect(`${base}?ok=langganan#buletin`);
}

export async function deleteSubscriber(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  if (id) {
    await query("DELETE FROM subscribers WHERE id = $1", [id]);
    await logActivity("Menghapus satu pelanggan buletin");
  }
  redirect("/admin/buletin?ok=terhapus");
}
