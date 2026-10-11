// Video di situs ini selalu berupa tautan YouTube. Berkas video tidak diunggah.

const ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Ambil id video dari berbagai bentuk tautan YouTube:
 * youtube.com/watch?v=…, youtu.be/…, /shorts/…, /live/…, /embed/….
 * Mengembalikan null bila bukan tautan YouTube yang sah.
 */
export function youtubeId(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "").toLowerCase();
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "watch") id = url.searchParams.get("v");
    else if (["embed", "shorts", "live", "v"].includes(parts[0] ?? "")) id = parts[1] ?? null;
  }
  return id && ID.test(id) ? id : null;
}

/** Alamat pemutar tanpa cookie pelacak. */
export function youtubeEmbedUrl(id: string, autoplay = false): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0${autoplay ? "&autoplay=1" : ""}`;
}

/** Gambar pratinjau video. */
export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Alamat tonton yang rapi, dipakai saat menyimpan. */
export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** Gambar pratinjau dari tautan YouTube, atau teks kosong bila tautannya bukan YouTube. */
export function videoThumb(url: string | null | undefined): string {
  const id = url ? youtubeId(url) : null;
  return id ? youtubeThumb(id) : "";
}
