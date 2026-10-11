// Penerjemah isi editor visual (HTML di dalam kotak sunting) menjadi Markdown,
// format yang disimpan di database dan dirender oleh lib/markdown.ts.
// Hanya unsur yang dikenal Markdown situs ini yang dipertahankan; sisanya menjadi teks biasa.

import { youtubeId, youtubeWatchUrl } from "./youtube";

const BLOCKS = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "UL", "OL", "FIGURE", "LI", "HR"]);

/** Bungkus teks dengan penanda, dengan spasi tepi dipindah ke luar supaya penandanya tetap sah. */
function mark(text: string, sign: string): string {
  const inner = text.trim();
  if (!inner) return text;
  const lead = text.slice(0, text.length - text.trimStart().length);
  const tail = text.slice(text.trimEnd().length);
  return `${lead}${sign}${inner}${sign}${tail}`;
}

function inlineOf(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replace(/\s+/g, " ");
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const element = node as HTMLElement;
  const inner = () => Array.from(element.childNodes).map(inlineOf).join("");
  switch (element.tagName) {
    case "BR":
      return " ";
    case "B":
    case "STRONG":
      return mark(inner(), "**");
    case "I":
    case "EM":
      return mark(inner(), "*");
    case "S":
    case "STRIKE":
    case "DEL":
      return mark(inner(), "~~");
    case "A": {
      const href = element.getAttribute("href") ?? "";
      const text = inner().trim();
      return href && text ? `[${text}](${href.replace(/\s/g, "%20")})` : text;
    }
    case "IMG": {
      const src = element.getAttribute("src") ?? "";
      const alt = (element.getAttribute("alt") ?? "").replace(/[\[\]]/g, "");
      return src ? `![${alt}](${src})` : "";
    }
    default:
      return inner();
  }
}

/** Alamat video dari blok video di editor atau dari pemutar hasil render. */
function videoOf(element: HTMLElement): string | null {
  const stored = element.getAttribute("data-video");
  if (stored) return stored;
  const frame = element.querySelector("iframe");
  const id = frame ? /\/embed\/([A-Za-z0-9_-]{11})/.exec(frame.getAttribute("src") ?? "")?.[1] : null;
  return id ? youtubeWatchUrl(id) : null;
}

function blocksOf(root: Node): string[] {
  const out: string[] = [];
  let loose = "";
  const flush = () => {
    const text = loose.replace(/\s+/g, " ").trim();
    if (text) out.push(text);
    loose = "";
  };

  for (const node of Array.from(root.childNodes)) {
    const element = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : null;
    if (!element || !BLOCKS.has(element.tagName)) {
      loose += inlineOf(node);
      continue;
    }
    flush();
    const video = element.tagName === "FIGURE" || element.classList.contains("embed") ? videoOf(element) : null;
    if (video) {
      out.push(video);
      continue;
    }
    const text = () => inlineOf(element).replace(/\s+/g, " ").trim();
    switch (element.tagName) {
      case "HR":
        out.push("---");
        break;
      case "H1":
      case "H2":
        if (text()) out.push(`## ${text()}`);
        break;
      case "H3":
      case "H4":
      case "H5":
      case "H6":
        if (text()) out.push(`### ${text()}`);
        break;
      case "BLOCKQUOTE": {
        const lines = blocksOf(element).flatMap((block) => block.split("\n"));
        if (lines.length) out.push(lines.map((line) => `> ${line.replace(/^(#{2,3}|[-*]|\d+[.)])\s+/, "")}`).join("\n"));
        break;
      }
      case "UL":
      case "OL": {
        const items = Array.from(element.children)
          .filter((child) => child.tagName === "LI")
          .map((item) => inlineOf(item).replace(/\s+/g, " ").trim())
          .filter(Boolean);
        if (items.length) {
          out.push(items.map((item, index) => (element.tagName === "OL" ? `${index + 1}. ${item}` : `- ${item}`)).join("\n"));
        }
        break;
      }
      default: {
        // Paragraf atau pembungkus yang masih berisi blok lain.
        const nested = Array.from(element.children).some((child) => BLOCKS.has(child.tagName));
        if (nested) out.push(...blocksOf(element));
        else if (text()) {
          // Tautan YouTube yang berdiri sendiri tetap ditulis sebagai alamat polos supaya menjadi pemutar.
          const only = element.textContent?.trim() ?? "";
          out.push(/^https?:\/\/\S+$/.test(only) && youtubeId(only) ? only : text());
        }
      }
    }
  }
  flush();
  return out;
}

/** Ubah isi kotak sunting menjadi Markdown. */
export function htmlToMarkdown(root: HTMLElement): string {
  return blocksOf(root).join("\n\n");
}

/** Blok video di dalam editor: tidak bisa diketik, hanya dipindah atau dihapus. */
export function videoBlock(url: string): string {
  const safe = url.replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<figure class="rich-video" contenteditable="false" data-video="${safe}">Video YouTube<small>${safe}</small></figure>`;
}

/** Siapkan HTML hasil render untuk disunting: pemutar video diganti blok keterangan. */
export function editableHtml(rendered: string): string {
  return rendered
    .replace(
      /<div class="embed"><iframe src="[^"]*\/embed\/([A-Za-z0-9_-]{11})[^"]*"[^>]*><\/iframe><\/div>/g,
      (_whole, id: string) => videoBlock(youtubeWatchUrl(id)),
    )
    .replace(/<p>/g, "<div>")
    .replace(/<\/p>/g, "</div>");
}
