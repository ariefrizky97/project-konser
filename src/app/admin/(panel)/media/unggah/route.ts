import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { ImageKitError, imagekitReady, uploadToImageKit } from "@/lib/imagekit";
import { thumb } from "@/lib/media";

// Unggah gambar: browser mengirim berkas ke rute ini, rute ini meneruskannya ke ImageKit,
// lalu alamat hasilnya dicatat di tabel media. Rute Next.js membaca multipart lewat
// request.formData(), jadi multer tidak diperlukan.

const MAX_BYTES = 10 * 1024 * 1024;

const MESSAGES: Record<string, string> = {
  kosong: "Pilih file gambar dulu.",
  jenis: "Jenis file tidak didukung. Pakai JPG, PNG, WebP, GIF, atau AVIF.",
  besar: "Ukuran gambar melebihi 10 MB. Perkecil dulu lalu unggah lagi.",
  asal: "Permintaan ditolak karena berasal dari situs lain.",
  masuk: "Sesi habis. Masuk lagi lalu ulangi.",
  imagekit: "ImageKit belum diatur. Isi IMAGEKIT_PRIVATE_KEY di file .env lalu jalankan ulang server.",
  unggah: "Gagal mengunggah ke ImageKit. Coba lagi.",
};

/** Kenali jenis gambar dari byte awalnya, bukan dari nama atau jenis yang dikirim browser. */
function sniff(bytes: Buffer): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  const head = bytes.subarray(0, 12).toString("latin1");
  if (head.startsWith("GIF87a") || head.startsWith("GIF89a")) return "image/gif";
  if (head.startsWith("RIFF") && head.slice(8, 12) === "WEBP") return "image/webp";
  if (head.slice(4, 8) === "ftyp" && /^avi[fs]/.test(head.slice(8, 12))) return "image/avif";
  return null;
}

export async function POST(request: Request) {
  const wantsJson = (request.headers.get("accept") ?? "").includes("application/json");
  const fail = (code: string, status: number, message?: string) =>
    wantsJson
      ? Response.json({ error: message ?? MESSAGES[code] }, { status })
      : new Response(null, { status: 303, headers: { Location: `/admin/media?galat=${code}` } });

  const user = await getCurrentUser();
  if (!user) {
    return wantsJson
      ? Response.json({ error: MESSAGES.masuk }, { status: 401 })
      : new Response(null, { status: 303, headers: { Location: "/admin" } });
  }

  // Tolak kiriman form dari situs lain.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return fail("asal", 403);

  if (!imagekitReady()) return fail("imagekit", 503);

  let file: FormDataEntryValue | null = null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return fail("kosong", 400);
  }
  if (!file || typeof file === "string" || file.size === 0) return fail("kosong", 400);
  if (file.size > MAX_BYTES) return fail("besar", 413);

  const data = Buffer.from(await file.arrayBuffer());
  const mime = sniff(data);
  if (!mime) return fail("jenis", 415);

  const filename = (file.name || "gambar").replace(/[^\w.\- ]+/g, "_").slice(0, 120);

  let uploaded;
  try {
    uploaded = await uploadToImageKit(data, filename, mime);
  } catch (error) {
    console.error("Unggah media:", error);
    return fail("unggah", 502, error instanceof ImageKitError ? error.message : undefined);
  }

  const row = await one<{ id: number }>(
    `INSERT INTO media (filename, mime, bytes, url, thumbnail_url, file_id, width, height, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      filename,
      mime,
      uploaded.size,
      uploaded.url,
      uploaded.thumbnailUrl,
      uploaded.fileId,
      uploaded.width,
      uploaded.height,
      user.id,
    ],
  );
  if (!row) return fail("unggah", 500);

  return wantsJson
    ? Response.json({ id: row.id, url: uploaded.url, thumb: thumb(uploaded.url), filename })
    : new Response(null, { status: 303, headers: { Location: "/admin/media?ok=diunggah" } });
}
