"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { getMessageById } from "@/lib/queries";
import { choice, int, longText, text, uniqueSlug } from "@/lib/form";
import { fromInputValue, normalizeUrl, slugify } from "@/lib/format";
import { makeExcerpt } from "@/lib/markdown";
import type { EventSubmission } from "@/lib/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Batas kiriman form publik: lima per sepuluh menit per alamat IP (di memori server).
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const store = globalThis as unknown as { __formHits?: Map<string, number[]> };

async function allowed(): Promise<boolean> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "lokal";
  const hits = (store.__formHits ??= new Map<string, number[]>());
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= LIMIT) return false;
  hits.set(ip, [...recent, now]);
  return true;
}

/** Form "Kirim event" di situs publik. Hasilnya masuk kotak masuk admin untuk ditinjau. */
export async function submitEvent(formData: FormData): Promise<void> {
  // Isian jebakan: tidak terlihat oleh orang, biasanya diisi robot.
  if (text(formData, "situs", 100)) redirect("/kirim-event?ok=terkirim");

  const title = text(formData, "title", 200);
  const name = text(formData, "name", 120);
  const email = text(formData, "email", 160);
  const startsAt = fromInputValue(text(formData, "starts_at", 20));
  if (!title || !name || !EMAIL.test(email) || !startsAt) redirect("/kirim-event?galat=lengkapi");
  if (!(await allowed())) redirect("/kirim-event?galat=terlalu-sering");

  const payload: EventSubmission = {
    title,
    type_id: int(formData, "type_id"),
    starts_at: text(formData, "starts_at", 20),
    ends_at: text(formData, "ends_at", 20),
    venue_name: text(formData, "venue_name", 160),
    city: text(formData, "city", 80),
    price_info: text(formData, "price_info", 200),
    ticket_url: normalizeUrl(text(formData, "ticket_url", 500)),
    organizer_name: text(formData, "organizer_name", 160),
  };
  await query(
    `INSERT INTO messages (kind, name, email, phone, subject, body, payload)
     VALUES ('event', $1, $2, $3, $4, $5, ($6::text)::jsonb)`,
    [name, email, text(formData, "phone", 40), title, longText(formData, "body", 5000), JSON.stringify(payload)],
  );
  redirect("/kirim-event?ok=terkirim");
}

/** Form kontak dan pasang iklan di situs publik. */
export async function submitMessage(formData: FormData): Promise<void> {
  if (text(formData, "situs", 100)) redirect("/kontak?ok=terkirim");

  const kind = choice(formData, "kind", ["pesan", "iklan"] as const, "pesan");
  const name = text(formData, "name", 120);
  const email = text(formData, "email", 160);
  const subject = text(formData, "subject", 200);
  const body = longText(formData, "body", 5000);
  const back = kind === "iklan" ? "/kontak?perihal=iklan&" : "/kontak?";
  if (!name || !EMAIL.test(email) || !subject || !body) redirect(`${back}galat=lengkapi`);
  if (!(await allowed())) redirect(`${back}galat=terlalu-sering`);

  await query(
    "INSERT INTO messages (kind, name, email, phone, subject, body) VALUES ($1, $2, $3, $4, $5, $6)",
    [kind, name, email, text(formData, "phone", 40), subject, body],
  );
  redirect(`${back}ok=terkirim`);
}

/** Setujui pengajuan event: dibuatkan draf event dari isinya, lalu admin tinggal memeriksa dan menerbitkan. */
export async function approveEvent(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = int(formData, "id");
  const found = id ? await getMessageById(id) : null;
  const message = found?.kind === "event" ? found : null;
  if (!message) redirect("/admin/kotak-masuk");
  if (message.event_id) redirect(`/admin/event/${message.event_id}`);

  const data: EventSubmission = message.payload ?? {};
  const startsAt = fromInputValue(data.starts_at ?? "") ?? new Date();
  let endsAt = fromInputValue(data.ends_at ?? "");
  if (endsAt && endsAt.getTime() < startsAt.getTime()) endsAt = null;
  const typeId = data.type_id
    ? ((await one<{ id: number }>("SELECT id FROM event_types WHERE id = $1", [data.type_id]))?.id ?? null)
    : null;
  const slug = await uniqueSlug("events", slugify(message.subject) || "event", null);

  const event = await one<{ id: number }>(
    `INSERT INTO events
       (title, slug, summary, description, type_id, starts_at, ends_at, venue_name, city,
        price_info, ticket_url, organizer_name, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft')
     RETURNING id`,
    [
      message.subject,
      slug,
      makeExcerpt(message.body, 160),
      message.body,
      typeId,
      startsAt,
      endsAt,
      data.venue_name ?? "",
      data.city ?? "",
      data.price_info ?? "",
      data.ticket_url ?? "",
      data.organizer_name ?? "",
    ],
  );
  if (!event) redirect("/admin/kotak-masuk");
  await query("UPDATE messages SET status = 'selesai', event_id = $1, handled_by = $2 WHERE id = $3", [
    event.id,
    user.name,
    message.id,
  ]);
  await logActivity(`Menyetujui pengajuan event "${message.subject}"`, `/admin/event/${event.id}`);
  redirect(`/admin/event/${event.id}?ok=dari-pengajuan`);
}

/** Tandai pesan selesai, tolak, buka lagi, atau hapus. */
export async function handleMessage(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = int(formData, "id");
  const action = choice(formData, "aksi", ["selesai", "ditolak", "baru", "hapus"] as const, "selesai");
  if (id) {
    if (action === "hapus") {
      await query("DELETE FROM messages WHERE id = $1", [id]);
      await logActivity("Menghapus satu pesan dari kotak masuk");
    } else {
      const row = await one<{ subject: string }>(
        "UPDATE messages SET status = $1, handled_by = $2 WHERE id = $3 RETURNING subject",
        [action, action === "baru" ? "" : user.name, id],
      );
      const verb = action === "ditolak" ? "Menolak" : action === "baru" ? "Membuka lagi" : "Menyelesaikan";
      if (row) await logActivity(`${verb} pesan "${row.subject}"`, "/admin/kotak-masuk");
    }
  }
  redirect(`/admin/kotak-masuk?ok=${action === "hapus" ? "terhapus" : "tersimpan"}`);
}
