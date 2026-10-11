import { getCurrentUser } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";
import { dayKey } from "@/lib/format";
import { listSubscribers } from "@/lib/queries";

/** Unduh daftar pelanggan buletin sebagai CSV. */
export async function GET() {
  if (!(await getCurrentUser())) return new Response("Masuk dulu.", { status: 401 });
  const subscribers = await listSubscribers();
  return csvResponse(`pelanggan-buletin-${dayKey(new Date())}.csv`, [
    ["Email", "Terdaftar"],
    ...subscribers.map((row) => [row.email, dayKey(row.created_at)]),
  ]);
}
