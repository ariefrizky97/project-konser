"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Elemen yang muncul perlahan saat masuk layar.
const REVEAL = "[data-flash], .sec, .widget, .finder, .adslot--inline";

/**
 * Pengatur gerak untuk seluruh halaman:
 * 1. Bagian di bawah layar muncul perlahan saat digulir masuk. Yang sudah terlihat
 *    sejak awal tidak disembunyikan, jadi tidak ada kedipan.
 * 2. Isi halaman memudar masuk setiap berpindah halaman.
 * 3. Garis tipis di tepi atas selama halaman berikutnya dimuat.
 * 4. Mencatat kunjungan halaman (tanpa data pribadi) untuk laporan trafik admin.
 * Dipasang sekali di layout; tidak perlu membungkus komponen lain.
 */
export function MotionRoot() {
  const pathname = usePathname();
  const search = useSearchParams()?.toString() ?? "";
  const bar = useRef<HTMLDivElement>(null);
  const giveUp = useRef<number | undefined>(undefined);
  const first = useRef(true);

  // Muncul perlahan saat masuk layar. Diulang setiap berpindah halaman.
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(REVEAL)).filter(
      (element) => !element.classList.contains("is-in"),
    );
    if (!targets.length) return;
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const target of targets) target.classList.add("is-in");
      return;
    }
    const fold = window.innerHeight;
    for (const target of targets) {
      if (target.getBoundingClientRect().top > fold) target.classList.add("is-wait");
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.remove("is-wait");
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -6% 0px" },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [pathname, search]);

  // Catat kunjungan halaman ini untuk laporan trafik di admin.
  useEffect(() => {
    if (!pathname) return;
    // Iklan yang tampil di halaman ini ikut dilaporkan supaya tayangannya terhitung.
    const ads = Array.from(document.querySelectorAll<HTMLElement>("[data-ad]"))
      .map((element) => Number(element.dataset.ad))
      .filter((id) => Number.isInteger(id) && id > 0);
    const body = JSON.stringify({ path: pathname, ads });
    try {
      if (!navigator.sendBeacon?.("/kunjungan", new Blob([body], { type: "application/json" }))) {
        void fetch("/kunjungan", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
      }
    } catch {
      // Pencatatan trafik tidak boleh mengganggu halaman.
    }
  }, [pathname]);

  // Isi halaman memudar masuk setelah berpindah halaman (muatan pertama diurus CSS).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const main = document.querySelector<HTMLElement>("main");
    if (!main) return;
    main.classList.remove("is-enter");
    void main.offsetWidth;
    main.classList.add("is-enter");
  }, [pathname, search]);

  // Mulai garis saat tautan internal diklik.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      const element = bar.current;
      if (!element) return;
      element.classList.remove("is-done");
      element.classList.add("is-going");
      // Bila navigasi batal atau gagal, garis dilepas sendiri.
      window.clearTimeout(giveUp.current);
      giveUp.current = window.setTimeout(() => element.classList.remove("is-going"), 10_000);
    }
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      window.clearTimeout(giveUp.current);
    };
  }, []);

  // Selesaikan garis ketika halaman baru sudah tampil.
  useEffect(() => {
    const element = bar.current;
    if (!element || !element.classList.contains("is-going")) return;
    window.clearTimeout(giveUp.current);
    element.classList.remove("is-going");
    element.classList.add("is-done");
    const timer = window.setTimeout(() => element.classList.remove("is-done"), 500);
    return () => window.clearTimeout(timer);
  }, [pathname, search]);

  return <div ref={bar} className="flashbar" aria-hidden="true" />;
}
