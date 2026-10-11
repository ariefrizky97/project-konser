// Daftar video YouTube untuk blok kategori di beranda.
//
// Admin mengisi satu tautan playlist (atau kanal), atau beberapa tautan video (satu per baris),
// di Admin > Kategori & label. Datanya diambil dari:
// - umpan RSS YouTube untuk playlist/kanal (tanpa kunci API): judul, tanggal, 15 video terbaru;
// - oEmbed YouTube untuk tautan video satuan (tanpa kunci API): judul video;
// - YouTube Data API bila YOUTUBE_API_KEY diisi: ditambah durasi tiap video.
// Hasilnya disimpan di memori satu jam. Bila YouTube tidak bisa dihubungi, pemutar tetap tampil
// (playlist lewat pemutar playlist bawaan YouTube, video satuan dengan gambar pratinjaunya).

import axios from "axios";
import { youtubeId, youtubeWatchUrl } from "./youtube";

export type YtVideo = { id: string; title: string; published: string | null; duration: string | null; channel?: string };
export type YtList = {
  title: string;
  /** Alamat "Tonton di YouTube". */
  url: string;
  videos: YtVideo[];
  /** Id playlist untuk pemutar playlist bawaan, dipakai bila daftar videonya tidak bisa diambil. */
  playlist: string | null;
};

export type YtSource = { playlist: string | null; channel: string | null; videos: string[]; invalid: string[] };

const MAX_VIDEOS = 20;
const FRESH_MS = 60 * 60 * 1000;
const RETRY_MS = 5 * 60 * 1000;
const PLAYLIST = /^[A-Za-z0-9_-]{12,64}$/;
const CHANNEL = /^UC[A-Za-z0-9_-]{22}$/;

function asUrl(text: string): URL | null {
  try {
    return new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
}

function isYoutubeHost(url: URL): boolean {
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "").toLowerCase();
  return host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com";
}

/** Id playlist dari tautan …?list=…, atau null. */
export function playlistIdOf(text: string): string | null {
  const url = asUrl(text.trim());
  if (!url || !isYoutubeHost(url)) return null;
  const id = url.searchParams.get("list");
  return id && PLAYLIST.test(id) ? id : null;
}

/** Id kanal dari tautan youtube.com/channel/UC…, atau null. */
export function channelIdOf(text: string): string | null {
  const url = asUrl(text.trim());
  if (!url || !isYoutubeHost(url)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[0] === "channel" && CHANNEL.test(parts[1] ?? "") ? parts[1] : null;
}

/** Pilah isian admin: satu playlist/kanal, atau daftar video. Baris yang tidak dikenali dikumpulkan. */
export function parseYoutubeSource(text: string): YtSource {
  const source: YtSource = { playlist: null, channel: null, videos: [], invalid: [] };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const playlist = playlistIdOf(line);
    const channel = playlist ? null : channelIdOf(line);
    const video = playlist || channel ? null : youtubeId(line);
    if (playlist) source.playlist ??= playlist;
    else if (channel) source.channel ??= channel;
    else if (video) {
      if (!source.videos.includes(video)) source.videos.push(video);
    } else source.invalid.push(line);
  }
  return source;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
      if (code[0] === "#") {
        const value = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(value) ? String.fromCodePoint(value) : whole;
      }
      return ENTITIES[code.toLowerCase()] ?? whole;
    })
    .trim();
}

/** Baca umpan RSS YouTube (playlist atau kanal). */
export function parseFeed(xml: string): { title: string; videos: YtVideo[] } {
  const head = xml.split("<entry>")[0] ?? "";
  const title = decodeXml(/<title>([\s\S]*?)<\/title>/.exec(head)?.[1] ?? "");
  const videos: YtVideo[] = [];
  for (const entry of xml.split("<entry>").slice(1)) {
    const id = /<yt:videoId>([A-Za-z0-9_-]{11})<\/yt:videoId>/.exec(entry)?.[1];
    if (!id) continue;
    videos.push({
      id,
      title: decodeXml(/<title>([\s\S]*?)<\/title>/.exec(entry)?.[1] ?? "") || "Video YouTube",
      published: /<published>([^<]+)<\/published>/.exec(entry)?.[1] ?? null,
      duration: null,
      channel: decodeXml(/<author>\s*<name>([\s\S]*?)<\/name>/.exec(entry)?.[1] ?? ""),
    });
  }
  return { title, videos: videos.slice(0, MAX_VIDEOS) };
}

/** "PT1H2M9S" → "1:02:09", "PT5M29S" → "05:29". */
export function formatDuration(iso: string | null | undefined): string | null {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? "");
  if (!match) return null;
  const [hours, minutes, seconds] = [match[1], match[2], match[3]].map((part) => Number(part ?? 0));
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

async function getText(url: string): Promise<string> {
  const response = await axios.get(url, { timeout: 4000, responseType: "text" });
  return typeof response.data === "string" ? response.data : JSON.stringify(response.data);
}

async function getJson<T>(url: string): Promise<T> {
  const response = await axios.get(url, { timeout: 4000 });
  return (typeof response.data === "string" ? JSON.parse(response.data) : response.data) as T;
}

type ApiVideo = {
  id: string;
  snippet?: { title?: string; publishedAt?: string; channelTitle?: string };
  contentDetails?: { duration?: string };
};

/** Judul, tanggal, dan durasi lewat YouTube Data API (butuh YOUTUBE_API_KEY). */
async function viaApi(source: YtSource, key: string): Promise<{ title: string; videos: YtVideo[] }> {
  const base = "https://www.googleapis.com/youtube/v3";
  let ids = source.videos.slice(0, MAX_VIDEOS);
  let title = "";
  if (source.playlist || source.channel) {
    const playlist = source.playlist ?? `UU${source.channel!.slice(2)}`;
    const items = await getJson<{ items?: { contentDetails?: { videoId?: string } }[] }>(
      `${base}/playlistItems?part=contentDetails&maxResults=${MAX_VIDEOS}&playlistId=${playlist}&key=${key}`,
    );
    ids = (items.items ?? []).map((item) => item.contentDetails?.videoId ?? "").filter((id) => /^[A-Za-z0-9_-]{11}$/.test(id));
    const info = await getJson<{ items?: { snippet?: { title?: string } }[] }>(
      `${base}/playlists?part=snippet&id=${playlist}&key=${key}`,
    );
    title = info.items?.[0]?.snippet?.title ?? "";
  }
  if (!ids.length) return { title, videos: [] };
  const details = await getJson<{ items?: ApiVideo[] }>(`${base}/videos?part=snippet,contentDetails&id=${ids.join(",")}&key=${key}`);
  const byId = new Map((details.items ?? []).map((item) => [item.id, item]));
  return {
    title,
    videos: ids.map((id) => {
      const item = byId.get(id);
      return {
        id,
        title: item?.snippet?.title || "Video YouTube",
        published: item?.snippet?.publishedAt ?? null,
        duration: formatDuration(item?.contentDetails?.duration),
        channel: item?.snippet?.channelTitle ?? "",
      };
    }),
  };
}

/** Tanpa kunci API: RSS untuk playlist/kanal, oEmbed untuk video satuan. */
async function viaFeeds(source: YtSource): Promise<{ title: string; videos: YtVideo[] }> {
  if (source.playlist || source.channel) {
    const query = source.playlist ? `playlist_id=${source.playlist}` : `channel_id=${source.channel}`;
    return parseFeed(await getText(`https://www.youtube.com/feeds/videos.xml?${query}`));
  }
  const videos = await Promise.all(
    source.videos.slice(0, MAX_VIDEOS).map(async (id, index): Promise<YtVideo> => {
      try {
        const info = await getJson<{ title?: string; author_name?: string }>(
          `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(youtubeWatchUrl(id))}`,
        );
        return { id, title: info.title || `Video ${index + 1}`, published: null, duration: null, channel: info.author_name ?? "" };
      } catch {
        return { id, title: `Video ${index + 1}`, published: null, duration: null };
      }
    }),
  );
  return { title: "", videos };
}

export type YtVia = "api" | "rss" | "gagal";
type Entry = { at: number; value: YtList | null; ok: boolean; via: YtVia; error: string };
const store = globalThis as unknown as { __ytlist?: Map<string, Entry> };

/** Pesan galat yang bisa dibaca dari jawaban YouTube (kunci salah, kuota habis, API belum aktif). */
function reason(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string } } | undefined;
    return (data?.error?.message || error.message || "Tidak bisa menghubungi YouTube.").replace(/<[^>]+>/g, "").slice(0, 240);
  }
  return error instanceof Error ? error.message.slice(0, 240) : "Tidak bisa menghubungi YouTube.";
}

/** Kosongkan simpanan daftar video supaya diambil ulang dari YouTube. */
export function clearYoutubeCache(): void {
  store.__ytlist?.clear();
  (store as unknown as { __ytchannel?: Map<string, unknown> }).__ytchannel?.clear();
}

/**
 * Daftar video untuk satu kategori. `text` adalah isian admin, `title` judul pilihan admin
 * (kosong berarti memakai judul playlist dari YouTube, atau nama kategori).
 */
export async function getYoutubeList(text: string, title: string, fallbackTitle: string): Promise<YtList | null> {
  return (await youtubeStatus(text, title, fallbackTitle)).list;
}

/**
 * Sama dengan getYoutubeList, ditambah keterangan dari mana datanya (YouTube Data API atau RSS)
 * dan pesan galat bila gagal. Dipakai di Admin > Kategori untuk memeriksa isian.
 */
export async function youtubeStatus(
  text: string,
  title: string,
  fallbackTitle: string,
): Promise<{ list: YtList | null; via: YtVia; error: string }> {
  const source = parseYoutubeSource(text);
  if (!source.playlist && !source.channel && !source.videos.length) return { list: null, via: "gagal", error: "" };
  const cacheKey = `${text}\u0000${title}`;
  const cache = (store.__ytlist ??= new Map());
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < (cached.ok ? FRESH_MS : RETRY_MS)) {
    return { list: cached.value, via: cached.via, error: cached.error };
  }

  const url = source.playlist
    ? `https://www.youtube.com/playlist?list=${source.playlist}`
    : source.channel
      ? `https://www.youtube.com/channel/${source.channel}`
      : youtubeWatchUrl(source.videos[0]);
  let fetched: { title: string; videos: YtVideo[] } = { title: "", videos: [] };
  let via: YtVia = "gagal";
  let error = "";
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (key) {
    try {
      fetched = await viaApi(source, key);
      via = "api";
    } catch (failure) {
      error = `YouTube Data API: ${reason(failure)}`;
      console.error("YouTube: Data API gagal, mencoba RSS.", error);
    }
  }
  if (via === "gagal") {
    // Tanpa kunci, atau kuncinya bermasalah: pakai RSS/oEmbed yang tidak butuh kunci.
    try {
      fetched = await viaFeeds(source);
      via = "rss";
    } catch (failure) {
      error = [error, `RSS: ${reason(failure)}`].filter(Boolean).join(" · ");
      console.error("YouTube: daftar video tidak bisa diambil.", error);
    }
  }
  const ok = via !== "gagal";
  // Gagal mengambil daftar: video satuan tetap tampil dengan gambar pratinjaunya.
  const videos =
    fetched.videos.length || !source.videos.length
      ? fetched.videos
      : source.videos.slice(0, MAX_VIDEOS).map((id, index) => ({ id, title: `Video ${index + 1}`, published: null, duration: null }));
  // Kanal juga punya playlist "semua unggahan" (UU…) untuk pemutar cadangan.
  const playlist = source.playlist ?? (source.channel ? `UU${source.channel.slice(2)}` : null);
  const list: YtList | null =
    videos.length || playlist ? { title: title || fetched.title || fallbackTitle, url, videos, playlist } : null;
  cache.set(cacheKey, { at: Date.now(), value: list, ok, via, error });
  return { list, via, error };
}

// ---- Otomatis untuk Musik dan Film ---------------------------------------------------------
//
// Bila isian YouTube kategori Musik atau Film dikosongkan dan YOUTUBE_API_KEY terpasang,
// daftar video diambil otomatis: Musik dari video musik terpopuler di Indonesia, Film dari
// trailer film Indonesia terbaru. Ketik "mati" di isian untuk menyembunyikannya.

const AUTO_FRESH_MS = 3 * 60 * 60 * 1000;
export const YT_OFF = "mati";

/** Nomor pekan ISO, untuk judul "Musik Week 31". */
export function isoWeek(date: Date): number {
  const day = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  return Math.ceil(((day.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const hasAutoYoutube = (slug: string) => slug === "musik" || slug === "film";

async function detailsOf(ids: string[], key: string): Promise<YtVideo[]> {
  if (!ids.length) return [];
  const details = await getJson<{ items?: ApiVideo[] }>(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${ids.join(",")}&key=${key}`,
  );
  const byId = new Map((details.items ?? []).map((item) => [item.id, item]));
  return ids
    .filter((id) => byId.has(id))
    .map((id) => {
      const item = byId.get(id)!;
      return {
        id,
        title: item.snippet?.title || "Video YouTube",
        published: item.snippet?.publishedAt ?? null,
        duration: formatDuration(item.contentDetails?.duration),
        channel: item.snippet?.channelTitle ?? "",
      };
    });
}

/** Daftar video otomatis untuk kategori Musik/Film. Null bila tidak berlaku atau tanpa kunci API. */
export async function autoYoutubeStatus(
  slug: string,
  title: string,
  now: Date = new Date(),
): Promise<{ list: YtList | null; via: YtVia; error: string }> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!hasAutoYoutube(slug) || !key) return { list: null, via: "gagal", error: "" };
  const cacheKey = `auto\u0000${slug}\u0000${title}`;
  const cache = (store.__ytlist ??= new Map());
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < (cached.ok ? AUTO_FRESH_MS : RETRY_MS)) {
    return { list: cached.value, via: cached.via, error: cached.error };
  }
  const base = "https://www.googleapis.com/youtube/v3";
  let videos: YtVideo[] = [];
  let error = "";
  try {
    if (slug === "musik") {
      const popular = await getJson<{ items?: ApiVideo[] }>(
        `${base}/videos?part=snippet,contentDetails&chart=mostPopular&regionCode=ID&videoCategoryId=10&maxResults=15&key=${key}`,
      );
      videos = (popular.items ?? []).map((item) => ({
        id: item.id,
        title: item.snippet?.title || "Video YouTube",
        published: item.snippet?.publishedAt ?? null,
        duration: formatDuration(item.contentDetails?.duration),
        channel: item.snippet?.channelTitle ?? "",
      }));
    } else {
      const since = new Date(now.getTime() - 90 * 86400000).toISOString();
      const found = await getJson<{ items?: { id?: { videoId?: string } }[] }>(
        `${base}/search?part=snippet&type=video&q=${encodeURIComponent("official trailer film indonesia")}&regionCode=ID&relevanceLanguage=id&publishedAfter=${encodeURIComponent(since)}&maxResults=15&key=${key}`,
      );
      const ids = (found.items ?? []).map((item) => item.id?.videoId ?? "").filter((id) => /^[A-Za-z0-9_-]{11}$/.test(id));
      videos = await detailsOf(ids, key);
    }
  } catch (failure) {
    error = `YouTube Data API: ${reason(failure)}`;
    console.error("YouTube: daftar otomatis gagal.", error);
  }
  const ok = !error;
  const search = slug === "musik" ? "musik indonesia terbaru" : "trailer film indonesia";
  const list: YtList | null = videos.length
    ? {
        title: title || (slug === "musik" ? `Musik Week ${isoWeek(now)}` : "Trailer"),
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(search)}`,
        videos,
        playlist: null,
      }
    : null;
  const via: YtVia = ok ? "api" : "gagal";
  cache.set(cacheKey, { at: Date.now(), value: list, ok, via, error });
  return { list, via, error };
}

/**
 * Daftar video untuk blok kategori di beranda: isian admin bila ada, otomatis untuk Musik/Film
 * bila isian kosong, tidak ada bila isian "mati".
 */
export async function categoryYoutube(category: { slug: string; name: string; youtube: string; youtube_title: string }) {
  const text = category.youtube.trim();
  if (text.toLowerCase() === YT_OFF) return { list: null, via: "gagal" as YtVia, error: "", auto: false };
  if (!text) return { ...(await autoYoutubeStatus(category.slug, category.youtube_title)), auto: true };
  return { ...(await youtubeStatus(text, category.youtube_title, `Video ${category.name}`)), auto: false };
}

// ---- Playlist milik kanal sendiri (untuk dipilih di admin) ----------------------------------

export type ChannelPlaylist = { id: string; title: string; count: number; thumb: string };
export type ChannelPlaylists = { channel: string; handle: string; playlists: ChannelPlaylist[]; error: string };

/** "https://www.youtube.com/@projectkonser" → { handle: "projectkonser" }; /channel/UC… → { id }. */
export function channelRefOf(link: string): { handle?: string; id?: string } | null {
  const url = asUrl(link.trim());
  if (!url || !isYoutubeHost(url)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0]?.startsWith("@") && /^@[\w.-]{3,100}$/.test(parts[0])) return { handle: parts[0].slice(1) };
  if (parts[0] === "channel" && CHANNEL.test(parts[1] ?? "")) return { id: parts[1] };
  return null;
}

/**
 * Semua playlist di kanal YouTube situs (alamat kanal dari Admin > Pengaturan), ditambah
 * "Semua video" (playlist unggahan kanal). Butuh YOUTUBE_API_KEY; disimpan satu jam.
 */
export async function channelPlaylists(link: string): Promise<ChannelPlaylists | null> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  const ref = channelRefOf(link);
  if (!key || !ref) return null;
  const cacheKey = `kanal\u0000${link}`;
  const cache = ((store as unknown as { __ytchannel?: Map<string, { at: number; value: ChannelPlaylists }> }).__ytchannel ??= new Map());
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < (cached.value.error ? RETRY_MS : FRESH_MS)) return cached.value;

  const base = "https://www.googleapis.com/youtube/v3";
  const result: ChannelPlaylists = { channel: "", handle: ref.handle ? `@${ref.handle}` : "", playlists: [], error: "" };
  try {
    type Channel = { id: string; snippet?: { title?: string }; contentDetails?: { relatedPlaylists?: { uploads?: string } } };
    const found = await getJson<{ items?: Channel[] }>(
      `${base}/channels?part=snippet,contentDetails&${ref.handle ? `forHandle=${encodeURIComponent(`@${ref.handle}`)}` : `id=${ref.id}`}&key=${key}`,
    );
    const channel = found.items?.[0];
    if (!channel) throw new Error("Kanal YouTube tidak ditemukan. Periksa alamat YouTube di Admin > Pengaturan.");
    result.channel = channel.snippet?.title ?? "";
    type Playlist = {
      id: string;
      snippet?: { title?: string; thumbnails?: Record<string, { url?: string }> };
      contentDetails?: { itemCount?: number };
    };
    const lists = await getJson<{ items?: Playlist[] }>(
      `${base}/playlists?part=snippet,contentDetails&channelId=${channel.id}&maxResults=50&key=${key}`,
    );
    const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
    if (uploads) result.playlists.push({ id: uploads, title: "Semua video kanal", count: 0, thumb: "" });
    for (const item of lists.items ?? []) {
      const thumbs = item.snippet?.thumbnails ?? {};
      result.playlists.push({
        id: item.id,
        title: item.snippet?.title || "Playlist",
        count: item.contentDetails?.itemCount ?? 0,
        thumb: thumbs.medium?.url || thumbs.high?.url || thumbs.default?.url || "",
      });
    }
  } catch (failure) {
    result.error = failure instanceof Error && !axios.isAxiosError(failure) ? failure.message : `YouTube Data API: ${reason(failure)}`;
  }
  cache.set(cacheKey, { at: Date.now(), value: result });
  return result;
}
