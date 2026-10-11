import { getCurrentUser } from "@/lib/auth";
import { createTemplate } from "@/lib/backup";
import { getSettings } from "@/lib/settings";

/** Template backup: susunan berkas backup tanpa isi, untuk melihat susunannya. Hanya admin. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Masuk dulu.", { status: 401 });
  if (user.role !== "admin") return new Response("Hanya admin.", { status: 403 });
  const body = await createTemplate((await getSettings()).site_name);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="projectkonser-template-backup.json"',
      "Cache-Control": "no-store",
    },
  });
}
