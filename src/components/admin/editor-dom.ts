// Alat bantu DOM untuk editor visual (Editor.tsx).
//
// Isi kotak sunting selalu dirapikan ke bentuk yang sama dengan Markdown situs ini:
// deretan "baris" di tingkat teratas, yaitu paragraf <div>, <h2>, <h3>, <blockquote>,
// daftar <ul>/<ol> berisi <li>, serta blok utuh berupa video (<figure>) dan garis (<hr>).
// Di dalam baris hanya ada teks, <b>, <i>, <s>, <a>, dan <img>.
//
// Browser menghasilkan susunan yang berbeda-beda saat mengetik (span bergaya, daftar di dalam
// judul, <br> di tengah paragraf). Semua itu dirapikan oleh normalize(), sedangkan posisi kursor
// disimpan sebagai hitungan karakter supaya bisa dikembalikan setelah isi disusun ulang.

import { youtubeId, youtubeWatchUrl } from "@/lib/youtube";
import { videoBlock } from "@/lib/richtext";

export type LineType = "div" | "h2" | "h3" | "blockquote" | "ul" | "ol";
type Line = { type: LineType; nodes: Node[] } | { atom: Element };

/** Penanda posisi kursor sementara selama isi disusun ulang. */
export const CARET = "X-CARET";

const CONTAINERS = new Set([
  "P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "UL", "OL", "LI", "FIGURE", "HR", "PRE",
  "SECTION", "ARTICLE", "ASIDE", "HEADER", "FOOTER", "MAIN", "NAV", "ADDRESS", "DETAILS", "SUMMARY",
  "FIGCAPTION", "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TD", "TH", "DL", "DT", "DD",
]);
const DROP = new Set([
  "SCRIPT", "STYLE", "META", "LINK", "TITLE", "TEMPLATE", "NOSCRIPT", "OBJECT", "EMBED", "SVG", "CANVAS",
  "INPUT", "BUTTON", "SELECT", "TEXTAREA", "VIDEO", "AUDIO",
]);
const RENAME: Record<string, string> = { STRONG: "B", EM: "I", STRIKE: "S", DEL: "S" };
const INLINE = new Set(["B", "I", "S", "A"]);

const isElement = (node: Node | null): node is HTMLElement => !!node && node.nodeType === Node.ELEMENT_NODE;
const isText = (node: Node | null): node is Text => !!node && node.nodeType === Node.TEXT_NODE;
const isCaret = (node: Node) => isElement(node) && node.tagName === CARET;
export const isAtom = (element: Element) => element.tagName === "FIGURE" || element.tagName === "HR";

function unwrap(element: Element) {
  element.replaceWith(...Array.from(element.childNodes));
}

function keepOnly(element: Element, allowed: string[]) {
  for (const attribute of Array.from(element.attributes)) {
    if (!allowed.includes(attribute.name)) element.removeAttribute(attribute.name);
  }
}

/** Elemen video dari HTML editor atau hasil render; `undefined` bila bukan video. */
function videoOf(element: HTMLElement): string | null | undefined {
  const tag = element.tagName;
  const stored = element.getAttribute("data-video");
  if (tag === "FIGURE" && stored) return youtubeId(stored) ? stored : null;
  const frame = tag === "IFRAME" ? element : element.classList.contains("embed") ? element.querySelector("iframe") : null;
  if (!frame) return tag === "IFRAME" ? null : undefined;
  const id = /\/embed\/([A-Za-z0-9_-]{11})/.exec(frame.getAttribute("src") ?? "")?.[1];
  return id ? youtubeWatchUrl(id) : null;
}

export function videoElement(url: string): HTMLElement {
  const holder = document.createElement("div");
  holder.innerHTML = videoBlock(url);
  return holder.firstElementChild as HTMLElement;
}

/** Ganti nama, buang, atau lepas pembungkus yang tidak dikenal Markdown situs ini. */
function clean(parent: Node) {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === Node.COMMENT_NODE || child.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      child.remove();
      continue;
    }
    if (!isElement(child) || child.tagName === CARET) continue;
    const tag = child.tagName;
    if (DROP.has(tag)) {
      child.remove();
      continue;
    }
    const video = videoOf(child);
    if (video !== undefined) {
      if (video) child.replaceWith(videoElement(video));
      else child.remove();
      continue;
    }
    clean(child);
    if (RENAME[tag]) {
      const renamed = document.createElement(RENAME[tag]);
      renamed.append(...Array.from(child.childNodes));
      child.replaceWith(renamed);
    } else if (tag === "A") {
      if (child.getAttribute("href")) keepOnly(child, ["href"]);
      else unwrap(child);
    } else if (tag === "IMG") {
      if (child.getAttribute("src")) keepOnly(child, ["src", "alt"]);
      else child.remove();
    } else if (INLINE.has(tag) || tag === "BR" || CONTAINERS.has(tag)) {
      keepOnly(child, []);
    } else {
      unwrap(child);
    }
  }
}

const hasBlockChild = (element: Element) =>
  Array.from(element.children).some((child) => CONTAINERS.has(child.tagName) || isAtom(child));

/** Teks bermakna: spasi dan baris baru dari penulisan HTML tidak dihitung, spasi tak terputus dihitung. */
const meaningful = (node: Node): boolean => {
  if (isText(node)) return /[^ \n\r\t]/.test(node.data);
  if (!isElement(node)) return false;
  if (node.tagName === "IMG" || node.tagName === "BR") return true;
  return Array.from(node.childNodes).some(meaningful);
};
const holdsCaret = (node: Node) => isCaret(node) || (isElement(node) && !!node.querySelector(CARET.toLowerCase()));

function typeOf(tag: string, inherited: LineType): LineType {
  if (tag === "H1" || tag === "H2") return "h2";
  if (/^H[3-6]$/.test(tag)) return "h3";
  if (tag === "BLOCKQUOTE") return "blockquote";
  if (tag === "UL") return "ul";
  if (tag === "OL") return "ol";
  if (tag === "LI" && inherited !== "ul" && inherited !== "ol") return "ul";
  return inherited;
}

/** Kumpulkan semua baris di dalam `parent`, berapa pun dalamnya susunan blok. */
function collect(parent: Element, type: LineType, out: Line[], carry: Node[], whole: boolean) {
  // Blok tanpa blok lain di dalamnya selalu menjadi satu baris, termasuk paragraf kosong.
  if (whole && !hasBlockChild(parent)) {
    out.push({ type, nodes: [...carry.splice(0), ...Array.from(parent.childNodes)] });
    return;
  }
  let run: Node[] = [];
  const flush = () => {
    if (run.some(meaningful)) out.push({ type, nodes: [...carry.splice(0), ...run] });
    else carry.push(...run.filter(holdsCaret));
    run = [];
  };
  for (const child of Array.from(parent.childNodes)) {
    if (!isElement(child) || (!CONTAINERS.has(child.tagName) && !isAtom(child))) {
      run.push(child);
      continue;
    }
    flush();
    if (child.tagName === "HR" || (child.tagName === "FIGURE" && child.hasAttribute("data-video"))) {
      out.push({ atom: child });
      continue;
    }
    collect(child, typeOf(child.tagName, type), out, carry, true);
  }
  flush();
}

/** Ada isi (teks, gambar, atau baris baru) sesudah `br` di dalam `container`? */
function contentAfter(br: Element, container: Element): boolean {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  walker.currentNode = br;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (isText(node) ? node.data.length > 0 : (node as Element).tagName === "IMG" || (node as Element).tagName === "BR") return true;
  }
  return false;
}

/** Pecah baris pada setiap <br> di tengahnya: Markdown situs ini tidak mengenal baris baru di dalam paragraf. */
function splitBreaks(line: HTMLElement): HTMLElement[] {
  const parts: HTMLElement[] = [];
  for (;;) {
    const cut = Array.from(line.querySelectorAll("br")).find((br) => contentAfter(br, line));
    if (!cut) break;
    const range = document.createRange();
    range.setStart(line, 0);
    range.setEndBefore(cut);
    const head = document.createElement(line.tagName);
    head.append(range.extractContents());
    cut.remove();
    parts.push(head);
  }
  parts.push(line);
  return parts;
}

const sameInline = (a: Node, b: Node) =>
  isElement(a) && isElement(b) && INLINE.has(a.tagName) && a.tagName === b.tagName && a.getAttribute("href") === b.getAttribute("href");

/** Rapikan format di dalam baris: buang yang kosong atau bertumpuk, gabungkan yang bersebelahan. */
function tidyInline(element: Element) {
  for (const child of Array.from(element.childNodes)) {
    if (isText(child) && !child.data) {
      child.remove();
      continue;
    }
    if (!isElement(child) || !INLINE.has(child.tagName)) continue;
    tidyInline(child);
    const empty = !child.textContent && !child.querySelector("img");
    const nested = child.parentElement?.closest(child.tagName.toLowerCase());
    if (empty || nested) unwrap(child);
  }
  let node = element.firstChild;
  while (node) {
    const next = node.nextSibling;
    if (next && sameInline(node, next)) {
      (node as Element).append(...Array.from(next.childNodes));
      next.remove();
      tidyInline(node as Element);
      continue;
    }
    node = next;
  }
}

/** Baris kosong diberi <br> supaya tetap bisa diklik; <br> sisa di ujung baris berisi dibuang. */
function finishLine(line: HTMLElement) {
  const filled = !!line.textContent || !!line.querySelector("img");
  for (const br of Array.from(line.querySelectorAll("br"))) br.remove();
  if (!filled) line.append(document.createElement("br"));
}

function build(root: HTMLElement, lines: Line[]) {
  const out: Node[] = [];
  let list: HTMLElement | null = null;
  for (const line of lines) {
    if ("atom" in line) {
      list = null;
      out.push(line.atom);
      continue;
    }
    const listed = line.type === "ul" || line.type === "ol";
    const element = document.createElement(listed ? "li" : line.type);
    element.append(...line.nodes);
    const parts = splitBreaks(element);
    for (const part of parts) {
      tidyInline(part);
      finishLine(part);
    }
    if (listed) {
      if (!list || list.tagName.toLowerCase() !== line.type) {
        list = document.createElement(line.type);
        out.push(list);
      }
      list.append(...parts);
    } else {
      list = null;
      out.push(...parts);
    }
  }
  if (!out.length) {
    const empty = document.createElement("div");
    empty.append(document.createElement("br"));
    out.push(empty);
  }
  root.replaceChildren(...out);
}

/** Susun ulang isi kotak sunting ke bentuk baku (lihat keterangan di atas). */
export function normalize(root: HTMLElement) {
  clean(root);
  const lines: Line[] = [];
  const carry: Node[] = [];
  collect(root, "div", lines, carry, false);
  if (carry.length) {
    const last = lines.findLast((line) => !("atom" in line));
    if (last && !("atom" in last)) last.nodes.push(...carry);
    else lines.push({ type: "div", nodes: carry });
  }
  build(root, lines);
}

// ---- Baris dan posisi kursor ---------------------------------------------------------------

/** Semua baris, berurutan: blok teratas, tetapi butir daftar dihitung satu per satu. */
export function lineList(root: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const element of Array.from(root.children) as HTMLElement[]) {
    if (element.tagName === "UL" || element.tagName === "OL") out.push(...(Array.from(element.children) as HTMLElement[]));
    else out.push(element);
  }
  return out;
}

export function lineType(line: Element): LineType {
  if (line.tagName === "LI") return line.parentElement?.tagName === "OL" ? "ol" : "ul";
  const tag = line.tagName.toLowerCase();
  return tag === "h2" || tag === "h3" || tag === "blockquote" ? tag : "div";
}

/** Satuan isi baris: teks (per karakter) dan gambar (satu). */
function units(line: Element): Node[] {
  const out: Node[] = [];
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (isText(node) ? node.data.length > 0 : (node as Element).tagName === "IMG") out.push(node);
  }
  return out;
}
const size = (node: Node) => (isText(node) ? node.data.length : 1);

export function lineLength(line: Element): number {
  return isAtom(line) ? 0 : units(line).reduce((total, node) => total + size(node), 0);
}

export function lineText(line: Element): string {
  return units(line)
    .map((node) => (isText(node) ? node.data : "￼"))
    .join("");
}

const indexIn = (node: Node) => Array.prototype.indexOf.call(node.parentNode?.childNodes ?? [], node) as number;

/** Posisi titik DOM sebagai hitungan karakter dari awal isi (antarbaris dihitung satu). */
export function pointToOffset(root: HTMLElement, container: Node, offset: number): number {
  const point = document.createRange();
  point.setStart(container, offset);
  let total = 0;
  for (const line of lineList(root)) {
    if (line === container || line.contains(container)) {
      if (isAtom(line)) return total;
      for (const unit of units(line)) {
        if (unit === container) return total + offset;
        const before = isText(unit) ? point.comparePoint(unit, 0) < 0 : point.comparePoint(unit.parentNode!, indexIn(unit)) < 0;
        if (before) total += size(unit);
      }
      return total;
    }
    if (point.comparePoint(line, 0) > 0) return total;
    total += lineLength(line) + 1;
  }
  return Math.max(0, total - 1);
}

/** Baris tempat hitungan `offset` jatuh, beserta sisa hitungan di dalam baris itu. */
export function locate(root: HTMLElement, offset: number): { index: number; inner: number } {
  const lines = lineList(root);
  let rest = offset;
  for (let index = 0; index < lines.length; index++) {
    const length = lineLength(lines[index]);
    if (rest <= length) return { index, inner: rest };
    rest -= length + 1;
  }
  const last = Math.max(0, lines.length - 1);
  return { index: last, inner: lines.length ? lineLength(lines[last]) : 0 };
}

/** Titik DOM untuk hitungan `inner` di dalam satu baris. */
export function pointInLine(line: Element, inner: number): [Node, number] {
  let rest = inner;
  let last: Node | null = null;
  for (const unit of units(line)) {
    if (isText(unit)) {
      if (rest <= unit.data.length) return [unit, rest];
      rest -= unit.data.length;
    } else {
      if (rest === 0) return [unit.parentNode!, indexIn(unit)];
      rest -= 1;
    }
    last = unit;
  }
  if (last && !isText(last)) return [last.parentNode!, indexIn(last) + 1];
  return [line, 0];
}

export function offsetToPoint(root: HTMLElement, offset: number): [Node, number] {
  const lines = lineList(root);
  const { index, inner } = locate(root, offset);
  const line = lines[index];
  if (!line) return [root, 0];
  if (!isAtom(line)) return pointInLine(line, inner);
  const after = lines.slice(index + 1).find((item) => !isAtom(item));
  if (after) return pointInLine(after, 0);
  const before = lines.slice(0, index).findLast((item) => !isAtom(item));
  return before ? pointInLine(before, lineLength(before)) : [root, 0];
}

export type Span = { start: number; end: number };

export function readSelection(root: HTMLElement): Span | null {
  const selection = document.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const start = pointToOffset(root, range.startContainer, range.startOffset);
  const end = range.collapsed ? start : pointToOffset(root, range.endContainer, range.endOffset);
  return { start, end: Math.max(start, end) };
}

export function writeSelection(root: HTMLElement, span: Span) {
  const selection = document.getSelection();
  if (!selection) return;
  const [startNode, startOffset] = offsetToPoint(root, span.start);
  const [endNode, endOffset] = span.end === span.start ? [startNode, startOffset] : offsetToPoint(root, span.end);
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Rapikan isi bila perlu, dengan kursor tetap di tempatnya. Bila isinya sudah rapi, DOM dan
 * pilihan tidak disentuh sama sekali (gaya ketik seperti Ctrl+B tanpa pilihan tetap berlaku).
 */
export function tidy(root: HTMLElement): boolean {
  const probe = root.cloneNode(true) as HTMLElement;
  normalize(probe);
  if (probe.innerHTML === root.innerHTML) return false;

  const selection = document.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  const inside = !!range && root.contains(range.startContainer) && root.contains(range.endContainer);
  if (!inside || !range) {
    normalize(root);
    return true;
  }
  // Sisipkan penanda di ujung pilihan, susun ulang, lalu baca posisi penanda sebagai hitungan karakter.
  const startMark = document.createElement(CARET);
  const endMark = range.collapsed ? null : document.createElement(CARET);
  const head = range.cloneRange();
  head.collapse(true);
  if (endMark) {
    const tail = range.cloneRange();
    tail.collapse(false);
    tail.insertNode(endMark);
  }
  head.insertNode(startMark);
  normalize(root);
  const at = (mark: Element | null) => (mark && root.contains(mark) ? pointToOffset(root, mark.parentNode!, indexIn(mark)) : null);
  const start = at(startMark);
  const end = endMark ? at(endMark) : start;
  for (const mark of Array.from(root.querySelectorAll(CARET.toLowerCase()))) mark.remove();
  root.normalize();
  if (start !== null) writeSelection(root, { start, end: Math.max(start, end ?? start) });
  return true;
}

/**
 * Ubah jenis baris `from`..`to` (indeks baris). Bila semuanya sudah berjenis `type`, baris
 * dikembalikan menjadi paragraf, sehingga tombol yang sama berfungsi sebagai sakelar.
 */
export function setLineType(root: HTMLElement, from: number, to: number, type: LineType, toggle = true) {
  const current = lineList(root);
  const chosen = current.slice(from, to + 1).filter((line) => !isAtom(line));
  const next: LineType = toggle && chosen.length && chosen.every((line) => lineType(line) === type) ? "div" : type;
  const lines: Line[] = current.map((line, index) =>
    isAtom(line)
      ? { atom: line }
      : { type: index >= from && index <= to ? next : lineType(line), nodes: Array.from(line.childNodes) },
  );
  build(root, lines);
}

/** Baris yang tercakup pilihan. Pilihan yang berakhir tepat di awal baris tidak menyertakan baris itu. */
export function selectedLines(root: HTMLElement, span: Span): [number, number] {
  const start = locate(root, span.start);
  const end = locate(root, span.end);
  let last = end.index;
  if (span.end > span.start && end.inner === 0 && last > start.index) last -= 1;
  return [start.index, last];
}

/** Bila kursor berada di ujung format (tebal, miring, tautan), pindahkan ke luar format itu. */
export function outsideFormatting(range: Range) {
  if (!range.collapsed) return;
  let node: Node = range.startContainer;
  const atEnd = isText(node)
    ? range.startOffset === node.data.length
    : isElement(node) && INLINE.has(node.tagName) && range.startOffset === node.childNodes.length;
  if (!atEnd) return;
  let target: Node | null = isText(node) ? null : node;
  const later = (from: Node) => {
    let next = from.nextSibling;
    while (next && isText(next) && !next.data) next = next.nextSibling;
    return next;
  };
  while (node.parentNode && isElement(node.parentNode) && INLINE.has(node.parentNode.tagName) && !later(node)) {
    node = node.parentNode;
    target = node;
  }
  if (target) {
    range.setStartAfter(target);
    range.collapse(true);
  }
}

/** Elemen <a> di posisi kursor, bila ada. */
export function anchorAt(root: HTMLElement): HTMLAnchorElement | null {
  const node = document.getSelection()?.anchorNode ?? null;
  const element = isElement(node) ? node : node?.parentElement ?? null;
  const anchor = element?.closest("a");
  return anchor && root.contains(anchor) ? (anchor as HTMLAnchorElement) : null;
}

/** Format yang berlaku di posisi kursor menurut susunan DOM. */
type Formats = { line: LineType | null; b: boolean; i: boolean; s: boolean; a: boolean };

export function formatsAt(root: HTMLElement): Formats {
  const empty: Formats = { line: null, b: false, i: false, s: false, a: false };
  const node = document.getSelection()?.anchorNode ?? null;
  if (!node || !root.contains(node) || node === root) return empty;
  const found: Formats = { ...empty };
  for (let walk: Node | null = node; walk && walk !== root; walk = walk.parentNode) {
    if (!isElement(walk)) continue;
    const tag = walk.tagName;
    if (tag === "B") found.b = true;
    if (tag === "I") found.i = true;
    if (tag === "S") found.s = true;
    if (tag === "A") found.a = true;
    if (walk.parentNode === root || tag === "LI") {
      found.line = lineType(walk);
      break;
    }
  }
  return found;
}
