import { getCurrentUser } from "@/lib/auth";
import { csvResponse } from "@/lib/csv";
import { dayKey } from "@/lib/format";
import { getTraffic, listPopularPosts } from "@/lib/queries";

const SPANS = [7, 30, 90];

/**
 * Ekspor trafik sebagai CSV: ?isi=harian (tayangan dan pengunjung per hari), ?isi=halaman
 * (halaman teramai), atau ?isi=artikel (artikel paling banyak dibaca). ?rentang=7|30|90.
 */
export async function GET(request: Request) {
  if (!(await getCurrentUser())) return new Response("Masuk dulu.", { status: 401 });
  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("rentang"));
  const span = SPANS.includes(requested) ? requested : 30;
  const kind = url.searchParams.get("isi") ?? "harian";
  const today = dayKey(new Date());

  if (kind === "artikel") {
    const posts = await listPopularPosts(100);
    return csvResponse(`trafik-artikel-${today}.csv`, [
      ["Peringkat", "Judul", "Kategori", "Dibaca", "Alamat"],
      ...posts.map((post, index) => [index + 1, post.title, post.category_name ?? "", post.views, `/berita/${post.slug}`]),
    ]);
  }

  const traffic = await getTraffic(span);
  if (kind === "halaman") {
    return csvResponse(`trafik-halaman-${span}-hari-${today}.csv`, [
      ["Peringkat", "Halaman", "Judul", `Tayangan ${span} hari`],
      ...traffic.pages.map((page, index) => [index + 1, page.path, page.title ?? "", page.views]),
    ]);
  }
  return csvResponse(`trafik-harian-${span}-hari-${today}.csv`, [
    ["Tanggal", "Tayangan", "Pengunjung"],
    ...traffic.days.map((day) => [day.day, day.views, day.visitors]),
    [],
    ["Total", traffic.days.reduce((sum, day) => sum + day.views, 0), traffic.days.reduce((sum, day) => sum + day.visitors, 0)],
  ]);
}
