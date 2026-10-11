"use client";

import { useEffect, useRef } from "react";

/**
 * Menyeimbangkan dua kolom beranda: bila kolom widget di kanan jauh lebih panjang dari kolom
 * utama, widget paling bawah (yang bertanda data-movable) dipindah ke bawah kolom utama supaya
 * tidak ada ruang kosong di kiri. Di layar sempit (satu kolom) semuanya dikembalikan ke tempatnya.
 */
export function ColsBalance() {
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const more = holder.current;
    const cols = more?.closest(".cols");
    const main = cols?.querySelector<HTMLElement>(".cols-main");
    const side = cols?.querySelector<HTMLElement>(".cols-side");
    if (!more || !cols || !main || !side) return;

    const widgets = Array.from(side.querySelectorAll<HTMLElement>(":scope > [data-movable]"));
    let busy = false;

    function restore() {
      for (const widget of widgets) side!.append(widget);
      more!.hidden = true;
    }

    function balance() {
      if (busy) return;
      busy = true;
      restore();
      const twoColumns = getComputedStyle(cols!).gridTemplateColumns.split(" ").filter(Boolean).length > 1;
      if (twoColumns) {
        // Pindahkan dari bawah selama selisih tinggi kedua kolom makin kecil.
        for (const widget of [...widgets].reverse()) {
          const gap = side!.getBoundingClientRect().height - main!.getBoundingClientRect().height;
          const height = widget.getBoundingClientRect().height + 24;
          if (gap <= 0 || Math.abs(gap - 2 * height) >= Math.abs(gap)) break;
          more!.hidden = false;
          more!.prepend(widget);
        }
      }
      requestAnimationFrame(() => {
        busy = false;
      });
    }

    let timer = 0;
    const later = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(balance, 150);
    };
    balance();
    window.addEventListener("resize", later);
    window.addEventListener("load", later);
    // Gambar dan widget yang dimuat belakangan (cuaca, kalender) mengubah tinggi kolom.
    const observer = new ResizeObserver(() => {
      if (!busy) later();
    });
    for (const child of Array.from(main.children)) if (child !== more) observer.observe(child);
    for (const child of Array.from(side.children)) observer.observe(child);
    return () => {
      window.removeEventListener("resize", later);
      window.removeEventListener("load", later);
      observer.disconnect();
      window.clearTimeout(timer);
      restore();
    };
  }, []);

  return <div className="cols-more" ref={holder} hidden />;
}
