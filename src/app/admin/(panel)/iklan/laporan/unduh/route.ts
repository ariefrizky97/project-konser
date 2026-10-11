import { getCurrentUser } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";
import { dayKey } from "@/lib/format";
import { getAdById, getAdDaily } from "@/lib/queries";

/** Unduh laporan satu iklan (90 hari terakhir) sebagai CSV. */
export async function GET(request: Request) {
  if (!(await getCurrentUser())) return new Response("Masuk dulu.", { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  const ad = Number.isInteger(id) && id > 0 ? await getAdById(id) : null;
  if (!ad) return new Response("Iklan tidak ditemukan.", { status: 404 });

  const days = await getAdDaily(ad.id, 90);
  const views = days.reduce((sum, row) => sum + row.views, 0);
  const clicks = days.reduce((sum, row) => sum + row.clicks, 0);
  const rate = (c: number, v: number) => (v > 0 ? `${((c / v) * 100).toFixed(2)}%` : "");

  return csvResponse(`laporan-iklan-${ad.name}-${dayKey(new Date())}.csv`, [
    ["Iklan", ad.name],
    ["Rentang", "90 hari terakhir"],
    [],
    ["Tanggal", "Tayangan", "Klik", "Rasio klik"],
    ...days.map((row) => [row.day, row.views, row.clicks, rate(row.clicks, row.views)]),
    ["Jumlah", views, clicks, rate(clicks, views)],
  ]);
}
