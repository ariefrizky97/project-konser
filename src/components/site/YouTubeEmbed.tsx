"use client";

import { useState } from "react";
import { youtubeEmbedUrl, youtubeThumb } from "@/lib/youtube";

/**
 * Pemutar YouTube ringan: awalnya hanya gambar pratinjau dan tombol putar.
 * Pemutar yang sebenarnya baru dimuat setelah tombol ditekan.
 */
export function YouTubeEmbed({
  id,
  title,
  onPlay,
}: {
  id: string;
  title: string;
  onPlay?: () => void;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="yt">
        <iframe
          src={youtubeEmbedUrl(id, true)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="yt yt--poster"
      onClick={() => {
        setPlaying(true);
        onPlay?.();
      }}
      aria-label={`Putar video: ${title}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={youtubeThumb(id)} alt="" loading="lazy" />
      <span className="yt-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28">
          <path fill="currentColor" d="M8 5.1v13.8a1 1 0 0 0 1.5.9l11.3-6.9a1 1 0 0 0 0-1.8L9.5 4.2A1 1 0 0 0 8 5.1z" />
        </svg>
      </span>
    </button>
  );
}
