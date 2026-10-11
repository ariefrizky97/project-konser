import { logActivity } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { createBackup, logBackup } from "@/lib/backup";
import { getSettings } from "@/lib/settings";

/** Unduh cadangan lengkap sebagai berkas JSON. Hanya admin. */
export async function GET(request: Request) {
  // Hanya dari halaman situs ini sendiri: tautan dari situs lain tidak bisa memicu unduhan.
  if (request.headers.get("sec-fetch-site") === "cross-site") return new Response("Permintaan dari situs lain ditolak.", { status: 403 });
  const user = await getCurrentUser();
  if (!user) return new Response("Masuk dulu.", { status: 401 });
  if (user.role !== "admin") return new Response("Hanya admin yang bisa mengunduh cadangan.", { status: 403 });

  const settings = await getSettings();
  const { doc, body } = await createBackup(user.name, settings.site_name);
  const stamp = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date())
    .replace(" ", "-")
    .replace(":", "");
  const fileName = `projectkonser-cadangan-${stamp}.json`;
  const size = Buffer.byteLength(body);
  const rows = Object.values(doc.counts).reduce((total, count) => total + count, 0);

  await logBackup({
    kind: "unduh",
    file_name: fileName,
    size_bytes: size,
    checksum: doc.checksum,
    table_count: Object.keys(doc.tables).length,
    row_count: rows,
    user_name: user.name,
  });
  await logActivity("Mengunduh cadangan database", "/admin/cadangan", user);

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
