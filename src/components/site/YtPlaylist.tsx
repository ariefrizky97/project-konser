"use client";

import { useState } from "react";

export type YtItem = { id: string; title: string; date: string; duration: string | null; channel: string };

const thumb = (id: string, size: "hq" | "mq" = "hq") => `https://i.ytimg.com/vi/${id}/${size}default.jpg`;

/**
 * Pemutar YouTube dengan daftar video di sampingnya (seperti playlist di YouTube).
 * Pemutar baru dimuat setelah diklik, supaya beranda tetap ringan.
 */
export function YtPlaylist({
  title,
  url,
  playlist,
  videos,
}: {
  title: string;
  url: string;
  playlist: string | null;
  videos: YtItem[];
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = videos[index] ?? null;

  const src = current
    ? `https://www.youtube-nocookie.com/embed/${current.id}?rel=0&autoplay=1`
    : `https://www.youtube-nocookie.com/embed/videoseries?list=${playlist}&rel=0&autoplay=1`;

  function choose(next: number) {
    setIndex(next);
    setPlaying(true);
  }

  return (
    <section className={`ytlist${videos.length ? "" : " ytlist--solo"}`} aria-label={`Video: ${title}`}>
      <div className="ytlist-player">
        {playing ? (
          <iframe
            key={src}
            src={src}
            title={current?.title ?? title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button type="button" className="ytlist-cover" onClick={() => setPlaying(true)} aria-label={`Putar ${current?.title ?? title}`}>
            {current && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb(current.id)} alt="" loading="lazy" decoding="async" />
            )}
            <span className="ytlist-cover-head">
              {current?.channel && (
                <span className="ytlist-avatar" aria-hidden="true">
                  {current.channel
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()}
                </span>
              )}
              <span className="ytlist-cover-text">
                <span className="ytlist-cover-title">{current?.title ?? title}</span>
                {current?.channel && <span className="ytlist-cover-channel">{current.channel}</span>}
              </span>
            </span>
            <span className="ytlist-play" aria-hidden="true">
              <svg viewBox="0 0 68 48" width="68" height="48">
                <path d="M66.5 7.7a8.6 8.6 0 0 0-6-6C55.2.3 34 .3 34 .3S12.8.3 7.5 1.7a8.6 8.6 0 0 0-6 6C0 13 0 24 0 24s0 11 1.5 16.3a8.6 8.6 0 0 0 6 6c5.3 1.4 26.5 1.4 26.5 1.4s21.2 0 26.5-1.4a8.6 8.6 0 0 0 6-6C68 35 68 24 68 24s0-11-1.5-16.3Z" fill="#f00" />
                <path d="m27 34 18-10-18-10z" fill="#fff" />
              </svg>
            </span>
          </button>
        )}
        <a className="ytlist-watch" href={current ? `https://www.youtube.com/watch?v=${current.id}` : url} target="_blank" rel="noopener noreferrer">
          Tonton di YouTube
        </a>
      </div>

      {videos.length > 0 && (
        <div className="ytlist-side">
          <div className="ytlist-head">
            <h3 className="ytlist-title">{title}</h3>
            <p className="ytlist-count">
              {index + 1} / {videos.length} video
              <a href={url} target="_blank" rel="noopener noreferrer">
                Buka di YouTube
              </a>
            </p>
          </div>
          <ol className="ytlist-items">
            {videos.map((video, position) => (
              <li key={video.id}>
                <button
                  type="button"
                  className="ytlist-item"
                  aria-current={position === index ? "true" : undefined}
                  onClick={() => choose(position)}
                >
                  <span className="ytlist-num">{position + 1}</span>
                  <span className="ytlist-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(video.id, "mq")} alt="" loading="lazy" decoding="async" />
                    {video.duration && <span className="ytlist-dur">{video.duration}</span>}
                  </span>
                  <span className="ytlist-text">
                    <span className="ytlist-name">{video.title}</span>
                    {video.date && <span className="ytlist-date">{video.date}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
