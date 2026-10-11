import axios from "axios";

export type UploadResult = { id: number; url: string; thumb: string; filename: string };

/**
 * Kirim satu gambar ke server (yang meneruskannya ke ImageKit) dengan axios.
 * `onProgress` menerima persentase 0 sampai 100 selama berkas dikirim.
 * Bila gagal, melempar Error dengan pesan yang siap ditampilkan.
 */
export async function uploadImage(file: File, onProgress?: (percent: number) => void): Promise<UploadResult> {
  const body = new FormData();
  body.append("file", file);
  try {
    const response = await axios.post<UploadResult>("/admin/media/unggah", body, {
      headers: { Accept: "application/json" },
      onUploadProgress: (event) => {
        const total = event.total ?? file.size;
        if (total > 0) onProgress?.(Math.min(100, Math.round((event.loaded / total) * 100)));
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = (error.response?.data as { error?: string } | undefined)?.error;
      throw new Error(message ?? "Gagal mengunggah. Periksa koneksi lalu coba lagi.");
    }
    throw new Error("Gagal mengunggah. Coba lagi.");
  }
}
