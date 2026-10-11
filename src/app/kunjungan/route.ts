import { createHash } from "node:crypto";
import { query } from "@/lib/db";
import { dayKey } from "@/lib/format";
import { registerAdViews } from "@/lib/queries";

// Pencatat kunjungan. Browser pengunjung memanggil rute ini sekali setiap membuka halaman
// (lihat MotionRoot). Yang disimpan hanya hitungan harian per halaman dan sidik harian
// pengunjung; alamat IP tidak disimpan. Admin yang sedang masuk dan robot tidak dihitung.

const BOT = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|curl|wget|python|axios/i;
const DAY = "(now() AT TIME ZONE 'Asia/Jakarta')::date";

function cleanPath(input: unknown): string | null {
  if (typeof input !== "string" || !input.startsWith("/") || input.startsWith("//")) return null;
  const path = input.split(/[?#]/)[0].slice(0, 200);
  if (path.startsWith("/admin") || path.startsWith("/kunjungan") || path.startsWith("/go/")) return null;
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });

  const agent = request.headers.get("user-agent") ?? "";
  if (!agent || BOT.test(agent)) return done;
  // Di situs yang sudah tayang, kunjungan admin yang sedang masuk tidak dihitung. Saat
  // pengembangan (npm run dev) tetap dihitung supaya laporannya bisa dicoba sendiri.
  const signedIn = /(?:^|;\s*)pk_sesi=/.test(request.headers.get("cookie") ?? "");
  if (signedIn && process.env.NODE_ENV === "production") return done;

  // Hanya terima panggilan dari halaman situs ini sendiri.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return done;

  let path: string | null = null;
  let ads: number[] = [];
  try {
    const body = (await request.json()) as { path?: unknown; ads?: unknown };
    path = cleanPath(body.path);
    if (Array.isArray(body.ads)) {
      ads = [...new Set(body.ads.filter((id): id is number => Number.isInteger(id) && id > 0))].slice(0, 6);
    }
  } catch {
    return done;
  }
  if (!path) return done;

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "lokal";
  const day = dayKey(new Date());
  const salt = process.env.VISIT_SALT || process.env.DATABASE_URL || "projectkonser";
  const hash = createHash("sha256").update(`${day}|${ip}|${agent}|${salt}`).digest("hex").slice(0, 32);

  try {
    await Promise.all([
      query(
        `INSERT INTO page_views (day, path, views) VALUES (${DAY}, $1, 1)
         ON CONFLICT (day, path) DO UPDATE SET views = page_views.views + 1`,
        [path],
      ),
      query(`INSERT INTO visitors (day, hash) VALUES (${DAY}, $1) ON CONFLICT DO NOTHING`, [hash]),
      registerAdViews(ads),
    ]);
    // Sesekali buang sidik pengunjung yang sudah lebih dari 90 hari.
    if (Math.random() < 0.01) await query(`DELETE FROM visitors WHERE day < ${DAY} - 90`);
  } catch (error) {
    console.error("Catat kunjungan:", error);
  }
  return done;
}
