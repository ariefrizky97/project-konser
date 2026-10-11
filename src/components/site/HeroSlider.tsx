"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Cover } from "./Cover";
import { YouTubeEmbed } from "./YouTubeEmbed";

export type HeroSlide = {
  id: number;
  kind: "photo" | "video";
  title: string;
  caption: string;
  /** Alamat gambar, atau null untuk memakai sampul bawaan. */
  image: string | null;
  /** Id video YouTube untuk slide video. */
  videoId: string | null;
  href: string;
};

const INTERVAL = 6000;

/**
 * Slide di bagian atas beranda. Bisa digeser dengan jari, tombol panah, atau titik.
 * Berganti sendiri tiap enam detik, dan berhenti saat disorot, difokus, video diputar,
 * tab tidak terlihat, atau pengunjung meminta gerak dikurangi.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [auto, setAuto] = useState(false);
  const count = slides.length;

  const go = useCallback(
    (index: number) => {
      const element = track.current;
      if (!element) return;
      const next = (index + count) % count;
      element.scrollTo({ left: next * element.clientWidth, behavior: "smooth" });
    },
    [count],
  );

  // Slide aktif dibaca dari posisi gulir, jadi geseran jari dan tombol selalu selaras.
  function onScroll() {
    const element = track.current;
    if (!element || element.clientWidth === 0) return;
    const index = Math.round(element.scrollLeft / element.clientWidth);
    if (index !== current) setCurrent(Math.min(Math.max(index, 0), count - 1));
  }

  useEffect(() => {
    setAuto(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const running = auto && count > 1 && !paused && playing === null;

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      if (!document.hidden) go(current + 1);
    }, INTERVAL);
    return () => window.clearTimeout(timer);
  }, [running, current, go]);

  if (count === 0) return null;

  return (
    <section
      className="slider"
      aria-roledescription="carousel"
      aria-label="Sorotan"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="slider-track" ref={track} onScroll={onScroll}>
        {slides.map((slide, index) => (
          <article
            key={slide.id}
            className={`slide${playing === slide.id ? " is-playing" : ""}`}
            aria-roledescription="slide"
            aria-label={`${index + 1} dari ${count}: ${slide.title}`}
          >
            <div className="slide-media">
              {slide.kind === "video" && slide.videoId ? (
                <YouTubeEmbed id={slide.videoId} title={slide.title} onPlay={() => setPlaying(slide.id)} />
              ) : slide.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slide.image} alt="" loading={index === 0 ? "eager" : "lazy"} />
              ) : (
                <Cover seed={`slide-${slide.id}-${slide.title}`} />
              )}
            </div>
            <div className="slide-text">
              <span className="pill">{slide.kind === "video" ? "Video" : "Sorotan"}</span>
              <h2 className="slide-title">{slide.title}</h2>
              {slide.caption && <p className="slide-caption">{slide.caption}</p>}
              {slide.href && (
                <Link href={slide.href} className="slide-link">
                  Lihat selengkapnya
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      {count > 1 && (
        <div className="slider-nav">
          <button type="button" className="icon-btn" onClick={() => go(current - 1)} aria-label="Slide sebelumnya">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="slider-dots">
            {slides.map((slide, index) => (
              <button
                type="button"
                key={slide.id}
                className={`slider-dot${index === current ? " is-current" : ""}${index === current && running ? " is-running" : ""}`}
                onClick={() => go(index)}
                aria-label={`Ke slide ${index + 1}: ${slide.title}`}
                aria-current={index === current ? "true" : undefined}
              />
            ))}
          </div>
          <button type="button" className="icon-btn" onClick={() => go(current + 1)} aria-label="Slide berikutnya">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
