import axios from "axios";

// Unggah dari server ke ImageKit memakai kunci privat. Kunci tidak pernah dikirim ke browser.
// Dokumentasi: https://imagekit.io/docs/api-reference/upload-file/upload-file
const UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";
const FILES_URL = "https://api.imagekit.io/v1/files";

export type UploadedImage = {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  width: number | null;
  height: number | null;
  size: number;
};

export class ImageKitError extends Error {}

export function imagekitReady(): boolean {
  return Boolean(process.env.IMAGEKIT_PRIVATE_KEY);
}

// ImageKit memakai Basic Auth: kunci privat sebagai nama pengguna, kata sandi kosong.
function authorization(): string {
  const key = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!key) {
    throw new ImageKitError("ImageKit belum diatur. Isi IMAGEKIT_PRIVATE_KEY di file .env.");
  }
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

function describe(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "ImageKit menolak kunci privat. Periksa IMAGEKIT_PRIVATE_KEY.";
    }
    if (message) return `ImageKit: ${message}`;
    if (error.code === "ECONNABORTED") return "ImageKit tidak menjawab tepat waktu. Coba lagi.";
  }
  return fallback;
}

export async function uploadToImageKit(data: Buffer, fileName: string, mime: string): Promise<UploadedImage> {
  const Authorization = authorization();
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(data)], { type: mime }), fileName);
  form.append("fileName", fileName);
  form.append("useUniqueFileName", "true");
  form.append("folder", process.env.IMAGEKIT_FOLDER || "/projectkonser");

  try {
    const response = await axios.post(UPLOAD_URL, form, {
      headers: { Authorization },
      timeout: 30_000,
      maxBodyLength: Infinity,
    });
    const file = response.data as Partial<UploadedImage>;
    if (!file.fileId || !file.url) throw new ImageKitError("ImageKit mengirim jawaban yang tidak dikenali.");
    return {
      fileId: file.fileId,
      name: file.name ?? fileName,
      url: file.url,
      thumbnailUrl: file.thumbnailUrl ?? file.url,
      width: typeof file.width === "number" ? file.width : null,
      height: typeof file.height === "number" ? file.height : null,
      size: typeof file.size === "number" ? file.size : data.length,
    };
  } catch (error) {
    if (error instanceof ImageKitError) throw error;
    throw new ImageKitError(describe(error, "Gagal mengunggah ke ImageKit. Coba lagi."));
  }
}

/** Hapus berkas dari ImageKit. Berkas yang sudah tidak ada dianggap berhasil. */
export async function deleteFromImageKit(fileId: string): Promise<void> {
  const Authorization = authorization();
  try {
    await axios.delete(`${FILES_URL}/${encodeURIComponent(fileId)}`, {
      headers: { Authorization },
      timeout: 15_000,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return;
    throw new ImageKitError(describe(error, "Gagal menghapus berkas dari ImageKit."));
  }
}
