"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Menyegarkan data halaman secara berkala tanpa memuat ulang halaman, supaya angka
 * laporan mengikuti keadaan terbaru. Berhenti selama tab tidak sedang dilihat.
 */
export function LiveRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  const [stamp, setStamp] = useState("");

  useEffect(() => {
    const clock = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setStamp(clock());
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
      setStamp(clock());
    };
    const timer = window.setInterval(refresh, seconds * 1000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, seconds]);

  return (
    <p className="livenote" role="status">
      <span className="livenote-dot" aria-hidden="true" />
      Langsung: diperbarui tiap {seconds} detik{stamp && `, terakhir pukul ${stamp}`}
    </p>
  );
}
