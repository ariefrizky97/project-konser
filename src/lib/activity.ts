import { getCurrentUser } from "./auth";
import { query } from "./db";

/**
 * Catat satu kejadian di riwayat admin: siapa melakukan apa. Kegagalan mencatat
 * tidak boleh menggagalkan aksi utamanya, jadi galat hanya ditulis ke log server.
 */
export async function logActivity(action: string, href = "", who?: { id: number; name: string }): Promise<void> {
  try {
    const user = who ?? (await getCurrentUser());
    await query("INSERT INTO activity (user_id, user_name, action, href) VALUES ($1, $2, $3, $4)", [
      user?.id ?? null,
      user?.name ?? "Pengunjung",
      action.slice(0, 300),
      href.slice(0, 300),
    ]);
  } catch (error) {
    console.error("Catat aktivitas:", error);
  }
}
