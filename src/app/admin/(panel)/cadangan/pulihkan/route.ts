import { logActivity } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { CONFIRM_PHRASE, MAX_BACKUP_BYTES, currentColumns, logBackup, restoreBackup, validateBackup } from "@/lib/backup";
import { one } from "@/lib/db";

// Memulihkan cadangan lewat rute (bukan Server Action) supaya berkas besar tidak terkena
// batas ukuran kiriman Server Action. Semua pemeriksaan dilakukan di sini, bukan hanya di browser.

const back = (code: string, detail = "") =>
  new Response(null, {
    status: 303,
    headers: { Location: `/admin/cadangan?galat=${code}${detail ? `&rinci=${encodeURIComponent(detail.slice(0, 80))}` : ""}#pulihkan` },
  });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 303, headers: { Location: "/admin" } });
  if (user.role !== "admin") return back("akses");

  // Hanya dari halaman admin situs ini.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return back("asal");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back("cadangan-kosong");
  }
  const file = form.get("berkas");
  if (!file || typeof file === "string" || file.size === 0) return back("cadangan-kosong");
  if (file.size > MAX_BACKUP_BYTES) return back("cadangan-besar");
  if (!/\.json$/i.test(file.name || "")) return back("cadangan-jenis");
  if (String(form.get("konfirmasi") ?? "").trim() !== CONFIRM_PHRASE) return back("konfirmasi");
  if (form.get("sudah_unduh") !== "ya") return back("cadangan-centang");

  const checked = validateBackup(await file.text(), await currentColumns());
  if (!checked.ok) return back(checked.problem, checked.detail);

  let result: { tables: number; rows: number };
  try {
    result = await restoreBackup(checked.doc);
  } catch (error) {
    console.error("Pulihkan cadangan:", error);
    return back("cadangan-gagal");
  }

  await logBackup({
    kind: "pulih",
    file_name: (file.name || "").slice(0, 200),
    size_bytes: file.size,
    checksum: checked.doc.checksum,
    table_count: result.tables,
    row_count: result.rows,
    user_name: user.name,
  });
  // Id akun bisa berbeda di data yang dipulihkan, jadi dicari lagi lewat email.
  const actor = await one<{ id: number; name: string }>("SELECT id, name FROM users WHERE lower(email) = lower($1)", [user.email]);
  if (actor) await logActivity(`Memulihkan cadangan tanggal ${String(checked.doc.created_at).slice(0, 10)}`, "/admin/cadangan", actor);

  // Sesi masuk dikembalikan, jadi admin tetap masuk dan langsung melihat hasilnya.
  return new Response(null, { status: 303, headers: { Location: "/admin/cadangan?ok=dipulihkan" } });
}
