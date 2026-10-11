"use client";

import { useRef, useState } from "react";

/**
 * Tombol Sebelumnya / Berikutnya di blok kategori beranda. Semua halaman sudah dirender
 * di server; tombol ini hanya menampilkan halaman yang dipilih di blok tempatnya berada.
 */
export function CatPager({ pages, label }: { pages: number; label: string }) {
  const ref = useRef<HTMLElement>(null);
  const [page, setPage] = useState(0);

  function go(next: number) {
    const block = ref.current?.closest(".catblock");
    if (!block || next < 0 || next >= pages) return;
    block.querySelectorAll<HTMLElement>(".catpage").forEach((element) => {
      const shown = Number(element.dataset.page) === next;
      element.hidden = !shown;
      if (shown) {
        element.classList.remove("is-entering");
        void element.offsetWidth;
        element.classList.add("is-entering");
      }
    });
    setPage(next);
    const top = block.getBoundingClientRect().top;
    if (top < 0) block.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="catpager" ref={ref} aria-label={`Halaman ${label}`}>
      <button type="button" className="catpager-btn" onClick={() => go(page - 1)} disabled={page === 0}>
        <span aria-hidden="true">‹</span> Sebelumnya
      </button>
      <span className="catpager-count" aria-live="polite">
        {page + 1} / {pages}
      </span>
      <button type="button" className="catpager-btn" onClick={() => go(page + 1)} disabled={page === pages - 1}>
        Berikutnya <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}
