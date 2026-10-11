"use server";

import { logActivity } from "@/lib/activity";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearLoginFailures,
  createSession,
  destroySession,
  hashPassword,
  loginAllowed,
  recordLoginFailure,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { one, query } from "@/lib/db";
import { text } from "@/lib/form";

export async function login(formData: FormData): Promise<void> {
  const email = text(formData, "email", 200).toLowerCase();
  const password = String(formData.get("password") ?? "");

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "lokal";
  const key = `${ip}|${email}`;
  if (!loginAllowed(key)) redirect("/admin?galat=terlalu-sering");

  const user = await one<{ id: number; name: string; password_hash: string }>(
    "SELECT id, name, password_hash FROM users WHERE lower(email) = $1",
    [email],
  );
  const valid = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !valid) {
    recordLoginFailure(key);
    redirect("/admin?galat=salah");
  }

  clearLoginFailures(key);
  await createSession(user.id);
  await logActivity("Masuk ke admin", "", user);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin");
}

export async function changePassword(formData: FormData): Promise<void> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) redirect("/admin/pengguna?galat=sandi-pendek");

  const row = await one<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id = $1",
    [user.id],
  );
  if (!row || !(await verifyPassword(current, row.password_hash))) {
    redirect("/admin/pengguna?galat=sandi-salah");
  }

  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    await hashPassword(next),
    user.id,
  ]);
  await logActivity("Mengganti kata sandi");
  redirect("/admin/pengguna?ok=sandi");
}
