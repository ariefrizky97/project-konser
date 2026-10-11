// Penerjemah Markdown kecil untuk isi artikel. Seluruh teks di-escape lebih dulu,
// jadi HTML mentah yang diketik penulis tidak pernah ikut dirender.
//
// Yang didukung: ## judul, ### subjudul, **tebal**, *miring*, ~~coret~~, [teks](tautan),
// ![alt](gambar), > kutipan, daftar "- " dan "1. ", garis pemisah "---", serta paragraf.
// Tautan YouTube yang berdiri sendiri di satu baris menjadi pemutar video.

import { youtubeEmbedUrl, youtubeId } from "./youtube";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHref(url: string): string | null {
  const value = url.trim();
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  return null;
}

function inline(escaped: string): string {
  let out = escaped;
  // Gambar: ![alt](url)
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (whole, alt: string, url: string) => {
    const href = safeHref(url);
    return href ? `<img src="${href}" alt="${alt}" loading="lazy">` : whole;
  });
  // Tautan: [teks](url)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, text: string, url: string) => {
    const href = safeHref(url);
    if (!href) return whole;
    const external = /^https?:/i.test(href);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${href}"${attrs}>${text}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  out = out.replace(/~~([^~]+)~~/g, "<s>$1</s>");
  return out;
}

function videoEmbed(id: string): string {
  return (
    `<div class="embed"><iframe src="${youtubeEmbedUrl(id)}" title="Video YouTube" loading="lazy" ` +
    `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ` +
    `allowfullscreen></iframe></div>`
  );
}

type ListBlock = { tag: "ul" | "ol"; items: string[] };

export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  // Blok yang sedang dikumpulkan. Hanya satu yang terisi pada satu waktu.
  const open: { paragraph: string[]; quote: string[]; list: ListBlock | null } = {
    paragraph: [],
    quote: [],
    list: null,
  };

  const flushParagraph = () => {
    if (open.paragraph.length) {
      html.push(`<p>${inline(escapeHtml(open.paragraph.join(" ")))}</p>`);
      open.paragraph = [];
    }
  };
  const flushList = () => {
    if (open.list) {
      const items = open.list.items.map((item) => `<li>${inline(escapeHtml(item))}</li>`).join("");
      html.push(`<${open.list.tag}>${items}</${open.list.tag}>`);
      open.list = null;
    }
  };
  const flushQuote = () => {
    if (open.quote.length) {
      html.push(`<blockquote><p>${inline(escapeHtml(open.quote.join(" ")))}</p></blockquote>`);
      open.quote = [];
    }
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushAll();
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushAll();
      html.push("<hr>");
      continue;
    }
    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      const tag = heading[1].length === 2 ? "h2" : "h3";
      html.push(`<${tag}>${inline(escapeHtml(heading[2]))}</${tag}>`);
      continue;
    }
    if (/^https?:\/\/\S+$/.test(line)) {
      const videoId = youtubeId(line);
      if (videoId) {
        flushAll();
        html.push(videoEmbed(videoId));
        continue;
      }
    }
    const quoted = /^>\s?(.*)$/.exec(line);
    if (quoted) {
      flushParagraph();
      flushList();
      open.quote.push(quoted[1]);
      continue;
    }
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    const item = bullet ?? numbered;
    if (item) {
      flushParagraph();
      flushQuote();
      const tag: ListBlock["tag"] = bullet ? "ul" : "ol";
      if (open.list && open.list.tag !== tag) flushList();
      if (!open.list) open.list = { tag, items: [] };
      open.list.items.push(item[1]);
      continue;
    }
    flushList();
    flushQuote();
    open.paragraph.push(line);
  }
  flushAll();
  return html.join("\n");
}

/** Buang penanda Markdown untuk membuat cuplikan teks polos. */
export function stripMarkdown(source: string): string {
  return source
    .replace(/^https?:\/\/\S+$/gm, "")
    .replace(/^(-{3,}|\*{3,}|_{3,})$/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+[.)]\s+/gm, "")
    .replace(/\*\*?/g, "")
    .replace(/~~/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cuplikan teks polos, dipotong di batas kata. */
export function makeExcerpt(source: string, max = 160): string {
  const text = stripMarkdown(source);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max).replace(/[.,;:\s]+$/, "")}…`;
}
