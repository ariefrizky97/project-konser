"use server";

import { logActivity } from "@/lib/activity";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { int } from "@/lib/form";
import { deleteFromImageKit, imagekitReady } from "@/lib/imagekit";
import { getMediaById } from "@/lib/queries";

export async function deleteMedia(formData: FormData): Promise<void> {
  await requireUser();
  const id = int(formData, "id");
  const item = id ? await getMediaById(id) : null;
  if (!item) redirect("/admin/media");

  // Hapus berkasnya di ImageKit dulu. Bila gagal, catatannya dibiarkan supaya bisa dicoba lagi.
  if (item.file_id && imagekitReady()) {
    try {
      await deleteFromImageKit(item.file_id);
    } catch (error) {
      console.error("Hapus media:", error);
      redirect("/admin/media?galat=hapus-imagekit");
    }
  }

  await query("DELETE FROM media WHERE id = $1", [item.id]);
  await logActivity("Menghapus gambar dari media");
  redirect("/admin/media?ok=terhapus");
}
