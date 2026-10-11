"use client";

import { IconMoon, IconSun } from "./Icons";

type DocumentWithTransition = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/**
 * Tombol ganti tema. Pilihan disimpan di cookie supaya server langsung
 * mengirim tema yang benar dan halaman tidak berkedip saat dimuat.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const current =
      root.dataset.theme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "gelap" : "terang");
    const next = current === "gelap" ? "terang" : "gelap";

    const apply = () => {
      root.dataset.theme = next;
      document.cookie = `tema=${next}; path=/; max-age=31536000; samesite=lax`;
    };

    const doc = document as DocumentWithTransition;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduced) {
      apply();
      return;
    }

    // Tema lama memudar pelan ke tema baru.
    root.classList.add("theme-flip");
    doc
      .startViewTransition(apply)
      .finished.finally(() => root.classList.remove("theme-flip"));
  }

  return (
    <button type="button" className="icon-btn theme-toggle" onClick={toggle} aria-label="Ganti tema terang atau gelap">
      <IconSun className="theme-sun" />
      <IconMoon className="theme-moon" />
    </button>
  );
}
