"use client";

import { useEffect } from "react";
import { toast, type ToastKind } from "@/lib/toast";

// Mode pengembangan React menjalankan efek dua kali. Penanda ini mencegah toast kembar.
let lastShown = "";
let lastTime = 0;

/** Menampilkan toast sekali saat halaman tampil, misalnya "Tersimpan." setelah form dikirim. */
export function ToastOnLoad({ text, kind = "ok" }: { text: string; kind?: ToastKind }) {
  useEffect(() => {
    const now = Date.now();
    if (lastShown === text && now - lastTime < 1500) return;
    lastShown = text;
    lastTime = now;
    void toast(text, kind);
  }, [text, kind]);
  return null;
}
