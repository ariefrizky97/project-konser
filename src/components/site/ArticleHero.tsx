"use client";

import { useEffect, useRef } from "react";

/**
 * Gerak pembuka artikel. Komponen ini hanya menggambar panah di pojok kanan bawah,
 * tetapi juga mengurus paralaks: selama halaman digulir, ia mengisi variabel CSS --p
 * (0 sampai 1) pada pembuka, dan CSS menggeser gambar serta memudarkan teksnya.
 * Menekan panah menggulir halus ke isi artikel.
 */
export function HeroMotion({ target }: { target: string }) {
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const hero = button.current?.closest<HTMLElement>(".ahero");
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      hero.style.setProperty("--p", progress.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <button
      ref={button}
      type="button"
      className="ahero-down"
      aria-label="Gulir ke isi artikel"
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" })}
    >
      <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false">
        <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
