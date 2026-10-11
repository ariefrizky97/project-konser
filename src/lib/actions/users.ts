"use server";

import { logActivity } from "@/lib/activity";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hashPassword, requireAdmin, requireUser } from "@/lib/auth";
import { normalizeUrl } from "@/lib/format";
import { one, query } from "@/lib/db";
import { choice, int, text } from "@/lib/form";

export async function addUser(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = text(formData, "name", 80);
  const email = text(formData, "email", 200).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = choice(formData, "role", ["admin", "editor"] as const, "editor");

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/admin/pengguna?galat=data");
  }
  if (password.length < 8) redirect("/admin/pengguna?galat=sandi-pendek");

  const existing = await one<{ id: number }>("SELECT id FROM users WHERE lower(email) = $1", [
    email,
  ]);
  if (existing) redirect("/admin/pengguna?galat=email-dipakai");

  await query("INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)", [
    name,
    email,
    await hashPassword(password),
    role,
  ]);
  await logActivity("Menambah pengguna", "/admin/pengguna");
  redirect("/admin/pengguna?ok=tersimpan");
}

export async function deleteUser(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = int(formData, "id");
  // Admin tidak bisa menghapus akunnya sendiri, supaya selalu ada yang bisa masuk.
  if (!id || id === admin.id) redirect("/admin/pengguna?galat=diri-sendiri");
  await query("DELETE FROM users WHERE id = $1", [id]);
  await logActivity("Menghapus pengguna");
  redirect("/admin/pengguna?ok=terhapus");
}

/** Ubah nama tampilan dan foto profil akun sendiri. */
export async function saveProfile(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = text(formData, "name", 80);
  if (!name) redirect("/admin/pengguna?galat=nama");
  const avatar = normalizeUrl(text(formData, "avatar_url", 500));
  // Posisi foto: "x,y,zoom" dengan x dan y 0–100 dan zoom 1–3. Selain itu dianggap tengah.
  const rawCrop = text(formData, "avatar_crop", 40);
  const match = /^(\d{1,3}(?:\.\d+)?),(\d{1,3}(?:\.\d+)?),(\d(?:\.\d+)?)$/.exec(rawCrop);
  const crop =
    avatar && match && Number(match[1]) <= 100 && Number(match[2]) <= 100 && Number(match[3]) >= 1 && Number(match[3]) <= 3
      ? `${Number(match[1])},${Number(match[2])},${Number(match[3])}`
      : "";
  await query("UPDATE users SET name = $1, avatar_url = $2, avatar_crop = $3 WHERE id = $4", [name, avatar, crop, user.id]);
  await logActivity("Mengubah profil sendiri", "/admin/pengguna");
  revalidatePath("/", "layout");
  redirect("/admin/pengguna?ok=profil");
}
