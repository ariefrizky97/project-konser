"use client";

import { useState } from "react";
import { youtubeId } from "@/lib/youtube";

export type PlaylistOption = { id: string; title: string; count: number; thumb: string };
type Mode = "otomatis" | "video" | "playlist" | "mati";

const playlistOf = (text: string) => {
  try {
    const url = new URL(/^https?:\/\//i.test(text.trim()) ? text.trim() : `https://${text.trim()}`);
    const id = url.searchParams.get("list");
    return id && /^[A-Za-z0-9_-]{12,64}$/.test(id) ? id : null;
  } catch {
    return null;
  }
};
const playlistUrl = (id: string) => `https://www.youtube.com/playlist?list=${id}`;

/**
 * Pilihan video YouTube satu kategori: otomatis (Musik/Film), video satu per satu, satu
 * playlist (dari kanal sendiri atau tempel tautan), atau mati. Hasilnya dikirim sebagai isian
 * "youtube" bersama form baris kategori; server memeriksanya lagi saat disimpan.
 */
export function YoutubePicker({
  form,
  value,
  auto,
  autoLabel,
  playlists,
  channel,
  channelError,
}: {
  form: string;
  value: string;
  auto: boolean;
  autoLabel: string;
  playlists: PlaylistOption[];
  channel: string;
  channelError: string;
}) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const initialMode: Mode =
    value.trim().toLowerCase() === "mati"
      ? "mati"
      : lines.length === 1 && (playlistOf(lines[0]) || /youtube\.com\/channel\//.test(lines[0]))
        ? "playlist"
        : lines.length
          ? "video"
          : auto
            ? "otomatis"
            : "mati";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [videos, setVideos] = useState<string[]>(initialMode === "video" ? lines : [""]);
  const [playlist, setPlaylist] = useState(initialMode === "playlist" ? lines[0] : "");
  const [draft, setDraft] = useState("");

  const cleanVideos = videos.map((line) => line.trim()).filter(Boolean);
  const output =
    mode === "video" ? cleanVideos.join("\n") : mode === "playlist" ? playlist.trim() : mode === "mati" ? (auto ? "mati" : "") : "";
  const chosenId = playlistOf(playlist);

  function addVideos(text: string) {
    const found = text
      .split(/[\s,]+/)
      .map((part) => part.trim())
      .filter((part) => youtubeId(part));
    if (!found.length) return false;
    setVideos((now) => [...now.filter(Boolean), ...found].slice(0, 15));
    return true;
  }

  const modes: { key: Mode; label: string; hint: string }[] = [
    ...(auto ? [{ key: "otomatis" as Mode, label: "Otomatis", hint: autoLabel }] : []),
    { key: "video", label: "Video satu per satu", hint: "Pilih sendiri, maksimal 15 video" },
    { key: "playlist", label: "Satu playlist", hint: "Satu folder playlist YouTube" },
    { key: "mati", label: auto ? "Mati" : "Tanpa video", hint: "Blok kategori tanpa video" },
  ];

  return (
    <div className="ytpick">
      <div className="ytpick-modes" role="radiogroup" aria-label="Sumber video">
        {modes.map((item) => (
          <label key={item.key} className="ytpick-mode">
            <input type="radio" name={`${form}-yt-mode`} checked={mode === item.key} onChange={() => setMode(item.key)} />
            <span>
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
            </span>
          </label>
        ))}
      </div>

      {mode === "video" && (
        <div className="ytpick-panel">
          <ol className="ytpick-videos">
            {videos.map((line, index) => {
              const id = youtubeId(line);
              return (
                <li key={index} className="ytpick-video">
                  <span className="ytpick-num">{index + 1}</span>
                  <span className="ytpick-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {id ? <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" loading="lazy" /> : <span aria-hidden="true">▶</span>}
                  </span>
                  <input
                    type="url"
                    value={line}
                    placeholder="https://youtu.be/…"
                    aria-label={`Tautan video ${index + 1}`}
                    aria-invalid={line.trim() && !id ? true : undefined}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setVideos(videos.map((item, at) => (at === index ? event.target.value : item)))
                    }
                  />
                  <span className="ytpick-actions">
                    <button type="button" className="ytpick-icon" aria-label="Naikkan" disabled={index === 0} onClick={() => {
                      const next = [...videos];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      setVideos(next);
                    }}>
                      ↑
                    </button>
                    <button type="button" className="ytpick-icon" aria-label="Turunkan" disabled={index === videos.length - 1} onClick={() => {
                      const next = [...videos];
                      [next[index + 1], next[index]] = [next[index], next[index + 1]];
                      setVideos(next);
                    }}>
                      ↓
                    </button>
                    <button type="button" className="ytpick-icon" aria-label="Hapus video" onClick={() => setVideos(videos.length > 1 ? videos.filter((_, at) => at !== index) : [""])}>
                      ×
                    </button>
                  </span>
                  {line.trim() && !id && <span className="field-error ytpick-error">Bukan tautan video YouTube.</span>}
                </li>
              );
            })}
          </ol>
          <div className="ytpick-add">
            <input
              type="text"
              value={draft}
              placeholder="Tempel satu atau beberapa tautan video, lalu Tambah"
              aria-label="Tambah tautan video"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDraft(event.target.value)}
              onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (addVideos(draft)) setDraft("");
                }
              }}
            />
            <button type="button" className="chip" disabled={videos.length >= 15} onClick={() => addVideos(draft) && setDraft("")}>
              Tambah
            </button>
          </div>
          <p className="field-hint">{cleanVideos.length} dari 15 video. Urutan di sini sama dengan urutan di beranda.</p>
        </div>
      )}

      {mode === "playlist" && (
        <div className="ytpick-panel">
          {playlists.length > 0 && (
            <>
              <p className="ytpick-label">Playlist di kanal {channel || "YouTube situs"}</p>
              <div className="ytpick-lists">
                {playlists.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="ytpick-list"
                    aria-pressed={chosenId === item.id}
                    onClick={() => setPlaylist(playlistUrl(item.id))}
                  >
                    <span className="ytpick-list-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {item.thumb ? <img src={item.thumb} alt="" loading="lazy" /> : <span aria-hidden="true">▶</span>}
                    </span>
                    <span className="ytpick-list-text">
                      <strong>{item.title}</strong>
                      <small>{item.count ? `${item.count} video` : "Semua unggahan"}</small>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {channelError && <p className="field-error">{channelError}</p>}
          {!playlists.length && !channelError && (
            <p className="field-hint">
              Daftar playlist kanal tampil di sini bila YOUTUBE_API_KEY terpasang dan alamat YouTube diisi di Admin › Pengaturan.
            </p>
          )}
          <label className="ytpick-label" htmlFor={`${form}-playlist`}>
            Atau tempel tautan playlist
          </label>
          <input
            id={`${form}-playlist`}
            type="url"
            value={playlist}
            placeholder="https://www.youtube.com/playlist?list=…"
            aria-invalid={playlist.trim() && !chosenId && !/youtube\.com\/channel\//.test(playlist) ? true : undefined}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPlaylist(event.target.value)}
          />
          {playlist.trim() && !chosenId && !/youtube\.com\/channel\//.test(playlist) && (
            <p className="field-error">Tautan playlist harus berisi ?list=…</p>
          )}
        </div>
      )}

      {mode === "otomatis" && <p className="ytpick-note">{autoLabel}. Butuh YOUTUBE_API_KEY.</p>}
      {mode === "mati" && <p className="ytpick-note">Blok kategori ini tampil tanpa pemutar video.</p>}

      <textarea name="youtube" form={form} value={output} readOnly hidden aria-hidden="true" />
    </div>
  );
}
