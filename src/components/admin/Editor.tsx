"use client";

import { useEffect, useRef, useState } from "react";
import { renderMarkdown, stripMarkdown } from "@/lib/markdown";
import { editableHtml, htmlToMarkdown } from "@/lib/richtext";
import { toast } from "@/lib/toast";
import { youtubeId, youtubeWatchUrl } from "@/lib/youtube";
import {
  anchorAt,
  formatsAt,
  isAtom,
  lineLength,
  lineList,
  lineText,
  lineType,
  locate,
  normalize,
  offsetToPoint,
  outsideFormatting,
  pointInLine,
  pointToOffset,
  readSelection,
  selectedLines,
  setLineType,
  tidy,
  videoElement,
  writeSelection,
  type LineType,
  type Span,
} from "./editor-dom";
import { uploadImage } from "./upload";

type Kind = "typing" | "edit" | "load";
type Snap = { html: string; span: Span };
type Active = { line: LineType | null; b: boolean; i: boolean; s: boolean; a: boolean };

const IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif,image/avif";
const SHORTCUTS: Record<string, LineType> = {
  "## ": "h2",
  "### ": "h3",
  "- ": "ul",
  "* ": "ul",
  "1. ": "ol",
  "1) ": "ol",
  "> ": "blockquote",
};

/** Ikon tombol editor (garis 24×24, warna mengikuti teks). */
function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    undo: <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
    redo: <path d="m15 14 5-5-5-5m5 5H9.5a5.5 5.5 0 0 0 0 11H13" />,
    quote: <path d="M5 17c2.2-1 3.5-3 3.5-6.5V7H4.5v4h4M14.5 17c2.2-1 3.5-3 3.5-6.5V7h-4v4h4" />,
    ul: (
      <>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
    ol: <path d="M10 6h10M10 12h10M10 18h10M4 4.5l1.5-1V8M3.8 10.6c.2-.7.8-1.1 1.5-1.1.8 0 1.4.5 1.4 1.2 0 1.2-2.9 2-2.9 3.3h2.9M3.9 16.4h2.6l-1.4 1.5c.9 0 1.6.5 1.6 1.3S6 20.5 5.2 20.5c-.7 0-1.2-.3-1.4-.8" />,
    link: <path d="M10 13a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.6 1.6M14 11a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.6-1.6" />,
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <circle cx="9" cy="10" r="1.7" />
        <path d="m21 16-5-5-9.5 9" />
      </>
    ),
    upload: <path d="M12 15V4m-5 5 5-5 5 5M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />,
    video: (
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="3.5" />
        <path d="m10 9.2 5 2.8-5 2.8z" fill="currentColor" />
      </>
    ),
    hr: <path d="M3 12h18M7 6.5h10M7 17.5h10" strokeOpacity="1" />,
    clear: <path d="m7.5 20-4-4a1.5 1.5 0 0 1 0-2.1l9.4-9.4a1.5 1.5 0 0 1 2.1 0l4.6 4.6a1.5 1.5 0 0 1 0 2.1L12 20M21 20H7.5M6 11.5l7 7" />,
    full: <path d="M8 3.5H5A1.5 1.5 0 0 0 3.5 5v3M20.5 8V5A1.5 1.5 0 0 0 19 3.5h-3M3.5 16v3A1.5 1.5 0 0 0 5 20.5h3M16 20.5h3a1.5 1.5 0 0 0 1.5-1.5v-3" />,
    shrink: <path d="M8 3.5V7A1 1 0 0 1 7 8H3.5M20.5 8H17a1 1 0 0 1-1-1V3.5M3.5 16H7a1 1 0 0 1 1 1v3.5M16 20.5V17a1 1 0 0 1 1-1h3.5" />,
  };
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const paragraph = () => {
  const element = document.createElement("div");
  element.append(document.createElement("br"));
  return element;
};

function imageLine(src: string, alt: string) {
  const line = document.createElement("div");
  const image = document.createElement("img");
  image.setAttribute("src", src);
  image.setAttribute("alt", alt);
  line.append(image);
  return line;
}

/** "foto-panggung_utama.jpg" → "foto panggung utama", dipakai sebagai teks alternatif gambar. */
const altFromFile = (name: string) => name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

/**
 * Editor isi artikel. Tampilan bawaannya visual: teks yang ditebalkan langsung terlihat tebal,
 * judul terlihat sebagai judul, dan Ctrl+Z / ⌘Z membatalkan langkah terakhir. Isinya tetap
 * disimpan sebagai Markdown (lihat lib/richtext.ts) dan bisa disunting langsung lewat tombol "Markdown".
 *
 * Riwayat urungkan dikelola sendiri (bukan bawaan browser), karena isi kotak sunting dirapikan
 * setelah setiap perubahan; dengan begitu Ctrl+Z selalu mengembalikan keadaan yang tadi terlihat.
 */
export function Editor({
  name,
  defaultValue = "",
  rows = 18,
}: {
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  const rich = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const history = useRef({ stack: [] as Snap[], index: -1, kind: "", at: 0 });
  const [value, setValue] = useState(defaultValue);
  const [source, setSource] = useState(false);
  const [full, setFull] = useState(false);
  const [active, setActive] = useState<Active>({ line: null, b: false, i: false, s: false, a: false });
  const [can, setCan] = useState({ undo: false, redo: false });
  const [uploading, setUploading] = useState(false);
  const [mod, setMod] = useState("Ctrl");

  // ---- Dasar: sinkron ke Markdown, tanda tombol, riwayat --------------------------------------

  const sync = () => {
    if (rich.current) setValue(htmlToMarkdown(rich.current));
  };

  function refreshActive() {
    const root = rich.current;
    if (!root) return;
    const found = formatsAt(root);
    if (!found.line) return;
    const state = (command: string) => {
      try {
        return document.queryCommandState(command);
      } catch {
        return false;
      }
    };
    const heading = found.line === "h2" || found.line === "h3";
    const next: Active = {
      line: found.line,
      b: heading ? found.b : found.b || state("bold"),
      i: found.i || state("italic"),
      s: found.s || state("strikeThrough"),
      a: found.a,
    };
    setActive((now) =>
      now.line === next.line && now.b === next.b && now.i === next.i && now.s === next.s && now.a === next.a ? now : next,
    );
  }

  function record(kind: Kind) {
    const root = rich.current;
    if (!root) return;
    const h = history.current;
    const snap: Snap = { html: root.innerHTML, span: readSelection(root) ?? { start: 0, end: 0 } };
    const top = h.stack[h.index];
    const now = Date.now();
    if (top && top.html === snap.html) {
      top.span = snap.span;
    } else if (kind === "typing" && h.kind === "typing" && now - h.at < 900 && h.index > 0 && h.index === h.stack.length - 1) {
      // Ketikan beruntun digabung menjadi satu langkah urungkan.
      h.stack[h.index] = snap;
    } else {
      h.stack.splice(h.index + 1);
      h.stack.push(snap);
      if (h.stack.length > 200) h.stack.shift();
      h.index = h.stack.length - 1;
    }
    h.kind = kind;
    h.at = now;
    setCan({ undo: h.index > 0, redo: h.index < h.stack.length - 1 });
  }

  function restore(step: number) {
    const root = rich.current;
    const h = history.current;
    const target = h.index + step;
    if (!root || target < 0 || target >= h.stack.length) return;
    h.index = target;
    h.kind = "";
    root.innerHTML = h.stack[target].html;
    root.focus({ preventScroll: true });
    writeSelection(root, h.stack[target].span);
    scrollCaret();
    sync();
    refreshActive();
    setCan({ undo: h.index > 0, redo: h.index < h.stack.length - 1 });
  }
  const undo = () => restore(-1);
  const redo = () => restore(1);

  /** Rapikan isi setelah perubahan, simpan ke Markdown, dan catat di riwayat. */
  function commit(kind: Kind) {
    const root = rich.current;
    if (!root) return;
    tidy(root);
    sync();
    record(kind);
    refreshActive();
  }

  /** Setelah perubahan susunan: rapikan, letakkan kursor di hitungan `span`, lalu catat. */
  function settle(span: Span) {
    const root = rich.current;
    if (!root) return;
    normalize(root);
    root.focus({ preventScroll: true });
    writeSelection(root, span);
    scrollCaret();
    sync();
    record("edit");
    refreshActive();
  }

  /** Perintah sunting bawaan browser, tanpa memicu penanganan ketikan. */
  function exec(command: string, argument?: string) {
    const was = busy.current;
    busy.current = true;
    try {
      document.execCommand(command, false, argument);
    } finally {
      busy.current = was;
    }
  }

  /** Pastikan kotak sunting fokus dan punya posisi kursor; kembalikan posisinya. */
  function focusSpan(): Span | null {
    const root = rich.current;
    if (!root) return null;
    if (document.activeElement !== root) root.focus({ preventScroll: true });
    const span = readSelection(root);
    if (span) return span;
    const end = pointToOffset(root, root, root.childNodes.length);
    writeSelection(root, { start: end, end });
    return { start: end, end };
  }

  function scrollCaret() {
    const root = rich.current;
    const selection = document.getSelection();
    if (!root || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    let rect = range.getBoundingClientRect();
    if (!rect.height) {
      const node = range.startContainer;
      const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
      if (element) rect = element.getBoundingClientRect();
    }
    const box = root.getBoundingClientRect();
    if (rect.bottom > box.bottom - 12) root.scrollTop += rect.bottom - box.bottom + 32;
    else if (rect.top < box.top + 12) root.scrollTop -= box.top - rect.top + 32;
  }

  // ---- Isi awal dan kembali dari mode Markdown -----------------------------------------------

  // Isi kotak visual hanya ditulis saat pertama tampil dan saat kembali dari mode Markdown,
  // supaya kursor tidak hilang selama mengetik.
  useEffect(() => {
    const root = rich.current;
    if (source || !root) return;
    root.innerHTML = editableHtml(renderMarkdown(value));
    normalize(root);
    try {
      document.execCommand("defaultParagraphSeparator", false, "div");
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      // Browser lama: bawaannya tetap bisa dipakai.
    }
    record("load");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setMod("⌘");
  }, []);

  // Tombol yang sedang berlaku di posisi kursor diberi tanda.
  const refreshRef = useRef(refreshActive);
  refreshRef.current = refreshActive;
  useEffect(() => {
    const onSelection = () => refreshRef.current();
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
  }, []);

  // Layar penuh: halaman di belakangnya tidak ikut bergulir.
  useEffect(() => {
    if (!full) return;
    document.documentElement.classList.add("editor-full-open");
    return () => document.documentElement.classList.remove("editor-full-open");
  }, [full]);

  // ---- Format baris dan teks -----------------------------------------------------------------

  function format(command: "bold" | "italic" | "strikeThrough") {
    if (!focusSpan()) return;
    exec(command);
    commit("edit");
  }

  /** Jadikan baris terpilih judul, subjudul, kutipan, atau daftar; tekan lagi untuk kembali ke paragraf. */
  function block(type: LineType) {
    const root = rich.current;
    const span = focusSpan();
    if (!root || !span) return;
    const [from, to] = selectedLines(root, span);
    setLineType(root, from, to, type);
    settle(span);
  }

  function clear() {
    const root = rich.current;
    const before = focusSpan();
    if (!root || !before) return;
    exec("removeFormat");
    exec("unlink");
    const anchor = anchorAt(root);
    if (anchor) anchor.replaceWith(...Array.from(anchor.childNodes));
    writeSelection(root, before);
    tidy(root);
    const span = readSelection(root) ?? before;
    const [from, to] = selectedLines(root, span);
    setLineType(root, from, to, "div", false);
    settle(span);
  }

  // ---- Enter, Backspace, pintasan Markdown ---------------------------------------------------

  /** Pecah baris di posisi kursor. Mengembalikan posisi kursor baru, tanpa mencatat riwayat. */
  function split(plain: boolean): Span | null {
    const root = rich.current;
    if (!root) return null;
    let span = readSelection(root);
    if (!span) return null;
    if (span.start !== span.end) {
      exec("delete");
      tidy(root);
      span = readSelection(root);
      if (!span) return null;
    }
    const lines = lineList(root);
    const { index, inner } = locate(root, span.start);
    const line = lines[index];
    if (!line) return null;
    if (isAtom(line)) {
      line.after(paragraph());
      return { start: span.start + 1, end: span.start + 1 };
    }
    const type = lineType(line);
    const length = lineLength(line);
    if (!plain && length === 0 && type !== "div") {
      // Enter di butir, judul, atau kutipan yang kosong mengembalikannya menjadi paragraf.
      setLineType(root, index, index, "div", false);
      return span;
    }
    if (!plain && type === "div" && lineText(line).trim() === "---") {
      line.replaceWith(document.createElement("hr"), paragraph());
      const start = span.start - inner + 1;
      return { start, end: start };
    }
    const [node, offset] = pointInLine(line, inner);
    const range = document.createRange();
    range.setStart(node, offset);
    range.setEnd(line, line.childNodes.length);
    const tail = range.extractContents();
    const titled = type === "h2" || type === "h3" || type === "blockquote";
    const fresh = document.createElement(titled && inner === length ? "div" : line.tagName.toLowerCase());
    fresh.append(tail);
    line.after(fresh);
    return { start: span.start + 1, end: span.start + 1 };
  }

  function enter() {
    const span = split(false);
    if (span) settle(span);
  }

  /** Seluruh isi terpilih lalu dihapus: mulai lagi dari satu paragraf kosong (tanpa sisa daftar atau judul). */
  function clearAll(): boolean {
    const root = rich.current;
    const span = root ? readSelection(root) : null;
    if (!root || !span || span.start !== 0 || span.end === 0) return false;
    if (span.end < pointToOffset(root, root, root.childNodes.length)) return false;
    root.replaceChildren(paragraph());
    settle({ start: 0, end: 0 });
    return true;
  }

  /** Backspace di awal baris berformat melepas formatnya; di awal baris sesudah video/garis, blok itu dihapus. */
  function backspace(): boolean {
    const root = rich.current;
    const span = root ? readSelection(root) : null;
    if (!root || !span) return false;
    if (span.start !== span.end) return clearAll();
    const lines = lineList(root);
    const { index, inner } = locate(root, span.start);
    const line = lines[index];
    if (!line || inner !== 0 || isAtom(line)) return false;
    if (lineType(line) !== "div") {
      setLineType(root, index, index, "div", false);
      settle(span);
      return true;
    }
    const previous = lines[index - 1];
    if (previous && isAtom(previous)) {
      previous.remove();
      settle({ start: span.start - 1, end: span.start - 1 });
      return true;
    }
    return false;
  }

  function forwardDelete(): boolean {
    const root = rich.current;
    const span = root ? readSelection(root) : null;
    if (!root || !span) return false;
    if (span.start !== span.end) return clearAll();
    const lines = lineList(root);
    const { index, inner } = locate(root, span.start);
    const line = lines[index];
    const next = lines[index + 1];
    if (!line || !next || !isAtom(next) || inner !== lineLength(line)) return false;
    next.remove();
    settle(span);
    return true;
  }

  /** Ketik "## ", "### ", "- ", "1. ", atau "> " di awal paragraf untuk langsung memformatnya. */
  function shortcut() {
    const root = rich.current;
    const span = root ? readSelection(root) : null;
    if (!root || !span || span.start !== span.end) return;
    const { index, inner } = locate(root, span.start);
    const line = lineList(root)[index];
    if (!line || lineType(line) !== "div") return;
    const type = SHORTCUTS[lineText(line).slice(0, inner).replace(/ /g, " ")];
    if (!type) return;
    const [node, offset] = pointInLine(line, inner);
    const range = document.createRange();
    range.setStart(line, 0);
    range.setEnd(node, offset);
    range.deleteContents();
    setLineType(root, index, index, type, false);
    const start = span.start - inner;
    settle({ start, end: start });
  }

  // ---- Sisipan: tautan, gambar, video, garis -------------------------------------------------

  /** Sisipkan blok baru sesudah baris kursor (atau menggantikan paragraf kosong). */
  function insertLines(elements: HTMLElement[], at?: Span | null): Span | null {
    const root = rich.current;
    if (!root) return null;
    const span = at ?? focusSpan();
    if (!span) return null;
    const lines = lineList(root);
    const line = lines[locate(root, span.end).index];
    if (!line) root.append(...elements);
    else if (line.tagName === "LI") {
      // Di tengah daftar: daftarnya dipecah supaya blok baru tepat di bawah butir ini.
      const list = line.parentElement!;
      const rest: Element[] = [];
      for (let next = line.nextElementSibling; next; next = next.nextElementSibling) rest.push(next);
      const tail = rest.length ? document.createElement(list.tagName.toLowerCase()) : null;
      tail?.append(...rest);
      list.after(...elements, ...(tail ? [tail] : []));
    } else if (!isAtom(line) && lineType(line) === "div" && lineLength(line) === 0) line.replaceWith(...elements);
    else line.after(...elements);
    const last = elements[elements.length - 1];
    let next = last.nextElementSibling;
    if (!next || isAtom(next)) {
      next = paragraph();
      last.after(next);
    }
    const start = pointToOffset(root, next, 0);
    const placed = { start, end: start };
    settle(placed);
    return placed;
  }

  function link() {
    const root = rich.current;
    const span = focusSpan();
    if (!root || !span) return;
    const current = anchorAt(root);
    const answer = window.prompt(
      "Alamat tautan (https://… atau /event/…). Kosongkan untuk melepas tautan.",
      current?.getAttribute("href") ?? "",
    );
    root.focus({ preventScroll: true });
    writeSelection(root, span);
    if (answer === null) return;
    const href = answer.trim();
    const anchor = anchorAt(root);
    if (!href) {
      if (anchor) {
        anchor.replaceWith(...Array.from(anchor.childNodes));
        writeSelection(root, span);
      } else exec("unlink");
      commit("edit");
      return;
    }
    const safe = /^(https?:\/\/|mailto:|\/)/i.test(href) ? href : `https://${href}`;
    if (anchor && span.start === span.end) {
      anchor.setAttribute("href", safe);
    } else if (span.start === span.end) {
      const selection = document.getSelection()!;
      const range = selection.getRangeAt(0);
      outsideFormatting(range);
      const element = document.createElement("a");
      element.setAttribute("href", safe);
      element.textContent = safe;
      range.insertNode(element);
      range.setStartAfter(element);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      exec("createLink", safe);
    }
    commit("edit");
  }

  function image() {
    const span = focusSpan();
    const url = window.prompt("Alamat gambar (https://…). Untuk file dari komputer, pakai tombol Unggah atau seret gambarnya ke sini.");
    const src = url?.trim();
    if (!src) return;
    if (!/^(https?:\/\/|\/)/i.test(src)) {
      void toast("Alamat gambar harus diawali https://", "error");
      return;
    }
    insertLines([imageLine(src, "")], span);
  }

  async function uploadFiles(files: File[]) {
    const root = rich.current;
    if (!root || !files.length) return;
    let span = readSelection(root);
    setUploading(true);
    try {
      for (const file of files) {
        const result = await uploadImage(file);
        span = insertLines([imageLine(result.url, altFromFile(file.name))], span);
      }
      void toast(files.length > 1 ? `${files.length} gambar diunggah dan disisipkan.` : "Gambar diunggah dan disisipkan.");
    } catch (error) {
      void toast((error as Error).message, "error");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function video() {
    const span = focusSpan();
    const url = window.prompt("Tautan YouTube, misalnya https://youtu.be/…");
    if (!url) return;
    const id = youtubeId(url);
    if (!id) {
      void toast("Itu bukan tautan YouTube yang dikenali.", "error");
      return;
    }
    insertLines([videoElement(youtubeWatchUrl(id))], span);
  }

  const rule = () => insertLines([document.createElement("hr")]);

  // ---- Peristiwa kotak sunting ---------------------------------------------------------------

  function onInput(event: React.FormEvent<HTMLDivElement>) {
    if (busy.current) return;
    const native = event.nativeEvent as InputEvent;
    if (native.isComposing) return;
    const typing = /^(insertText|insertReplacementText|insertCompositionText|delete)/.test(native.inputType ?? "");
    commit(typing ? "typing" : "edit");
    if (native.inputType === "insertText" && native.data === " ") shortcut();
  }

  // Tempelan dari situs lain dimasukkan sebagai teks polos (per paragraf) supaya gaya asing tidak ikut.
  function onPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const images = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith("image/"));
    if (images.length) {
      void uploadFiles(images);
      return;
    }
    const text = event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n").trim();
    if (!text) return;
    const parts = text.split(/\n+/);
    busy.current = true;
    try {
      parts.forEach((part, index) => {
        if (index > 0) {
          const span = split(true);
          const root = rich.current;
          if (span && root) {
            normalize(root);
            writeSelection(root, span);
          }
        }
        if (part) document.execCommand("insertText", false, part);
      });
    } finally {
      busy.current = false;
    }
    commit("edit");
    scrollCaret();
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    const images = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    if (!images.length) return;
    event.preventDefault();
    const root = rich.current;
    const point = typeof document.caretRangeFromPoint === "function" ? document.caretRangeFromPoint(event.clientX, event.clientY) : null;
    if (root && point && root.contains(point.startContainer)) {
      root.focus({ preventScroll: true });
      const selection = document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(point);
    }
    void uploadFiles(images);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      const handled = (action: () => void) => {
        event.preventDefault();
        action();
      };
      if (key === "z") return handled(event.shiftKey ? redo : undo);
      if (key === "y" && event.ctrlKey) return handled(redo);
      if (key === "b") return handled(() => format("bold"));
      if (key === "i") return handled(() => format("italic"));
      if (key === "u") return handled(() => undefined);
      if (key === "k") return handled(link);
      if (event.shiftKey && key === "x") return handled(() => format("strikeThrough"));
      if (event.shiftKey && event.code === "Digit7") return handled(() => block("ol"));
      if (event.shiftKey && event.code === "Digit8") return handled(() => block("ul"));
    }
    if ((event.ctrlKey || event.metaKey) && event.altKey && (event.code === "Digit2" || event.code === "Digit3")) {
      event.preventDefault();
      block(event.code === "Digit2" ? "h2" : "h3");
      return;
    }
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      enter();
      return;
    }
    if (/^(arrow|home$|end$|page)/.test(key)) history.current.kind = "";
  }

  // beforeinput bawaan (React tidak menyalurkan inputType): menu Edit › Urungkan, Enter dari
  // papan ketik layar sentuh, dan Backspace di awal baris.
  const beforeRef = useRef<(event: InputEvent) => void>(() => undefined);
  beforeRef.current = (event: InputEvent) => {
    if (event.isComposing) return;
    const stop = (action: () => void) => {
      event.preventDefault();
      action();
    };
    switch (event.inputType) {
      case "historyUndo":
        return stop(undo);
      case "historyRedo":
        return stop(redo);
      case "formatUnderline":
        return stop(() => undefined);
      case "formatBold":
        return stop(() => format("bold"));
      case "formatItalic":
        return stop(() => format("italic"));
      case "insertParagraph":
      case "insertLineBreak":
        return stop(enter);
      case "deleteContentBackward":
        if (backspace()) event.preventDefault();
        return;
      case "deleteContentForward":
        if (forwardDelete()) event.preventDefault();
        return;
      case "deleteByCut":
      case "deleteContent":
      case "deleteWordBackward":
      case "deleteWordForward":
        if (clearAll()) event.preventDefault();
        return;
    }
  };
  useEffect(() => {
    const root = rich.current;
    if (source || !root) return;
    const listener = (event: Event) => beforeRef.current(event as InputEvent);
    root.addEventListener("beforeinput", listener);
    return () => root.removeEventListener("beforeinput", listener);
  }, [source]);

  // ---- Tampilan ------------------------------------------------------------------------------

  // Tombol tidak boleh mengambil fokus dari kotak sunting, supaya pilihan teks tidak hilang.
  const keep = (event: React.MouseEvent) => event.preventDefault();
  const tool = (label: string, title: string, onClick: () => void, content: React.ReactNode, on?: boolean, off?: boolean) => (
    <button
      type="button"
      title={title}
      aria-label={label}
      aria-pressed={on ?? undefined}
      disabled={source || off}
      onMouseDown={keep}
      onClick={onClick}
    >
      {content}
    </button>
  );

  const words = stripMarkdown(value).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));

  return (
    <div
      className={`editor${full ? " is-full" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && full) {
          event.preventDefault();
          setFull(false);
        }
      }}
    >
      <div className="editor-bar" role="toolbar" aria-label="Format teks">
        <span className="editor-group">
          {tool("Urungkan", `Urungkan (${mod}+Z)`, undo, <Icon name="undo" />, undefined, !can.undo)}
          {tool("Ulangi", `Ulangi (${mod}+Shift+Z)`, redo, <Icon name="redo" />, undefined, !can.redo)}
        </span>
        <span className="editor-group">
          {tool("Judul", `Judul bagian (${mod}+Alt+2, atau ketik "## ")`, () => block("h2"), <span className="tool-text">H2</span>, active.line === "h2")}
          {tool("Subjudul", `Subjudul (${mod}+Alt+3, atau ketik "### ")`, () => block("h3"), <span className="tool-text">H3</span>, active.line === "h3")}
          {tool("Kutipan", 'Kutipan (atau ketik "> ")', () => block("blockquote"), <Icon name="quote" />, active.line === "blockquote")}
        </span>
        <span className="editor-group">
          {tool("Tebal", `Tebal (${mod}+B)`, () => format("bold"), <strong className="tool-text">B</strong>, active.b)}
          {tool("Miring", `Miring (${mod}+I)`, () => format("italic"), <em className="tool-text tool-serif">I</em>, active.i)}
          {tool("Coret", `Coret (${mod}+Shift+X)`, () => format("strikeThrough"), <s className="tool-text">S</s>, active.s)}
          {tool("Bersihkan format", "Bersihkan format pada teks terpilih", clear, <Icon name="clear" />)}
        </span>
        <span className="editor-group">
          {tool("Daftar butir", `Daftar butir (${mod}+Shift+8, atau ketik "- ")`, () => block("ul"), <Icon name="ul" />, active.line === "ul")}
          {tool("Daftar nomor", `Daftar bernomor (${mod}+Shift+7, atau ketik "1. ")`, () => block("ol"), <Icon name="ol" />, active.line === "ol")}
        </span>
        <span className="editor-group">
          {tool("Tautan", `Tautan (${mod}+K)`, link, <Icon name="link" />, active.a)}
          {tool("Gambar", "Sisipkan gambar dari alamat web", image, <Icon name="image" />)}
          {tool(
            "Unggah",
            "Unggah gambar dari komputer (bisa juga seret atau tempel gambar ke kotak isi)",
            () => fileInput.current?.click(),
            uploading ? <span className="tool-text tool-busy">Mengunggah…</span> : <Icon name="upload" />,
            undefined,
            uploading,
          )}
          {tool("Video", "Sisipkan video YouTube", video, <Icon name="video" />)}
          {tool("Garis pemisah", 'Garis pemisah (atau ketik "---" lalu Enter)', rule, <Icon name="hr" />)}
        </span>
        <span className="editor-end">
          <button
            type="button"
            className="editor-full"
            aria-label={full ? "Keluar layar penuh" : "Layar penuh"}
            aria-pressed={full}
            title={full ? "Keluar layar penuh (Esc)" : "Layar penuh"}
            onMouseDown={keep}
            onClick={() => setFull(!full)}
          >
            <Icon name={full ? "shrink" : "full"} />
          </button>
          <button
            type="button"
            className="editor-toggle"
            aria-pressed={source}
            title="Lihat dan sunting isi sebagai Markdown"
            onClick={() => setSource(!source)}
          >
            {source ? "Visual" : "Markdown"}
          </button>
        </span>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept={IMAGE_TYPES}
        multiple
        hidden
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) {
            const root = rich.current;
            if (root && !readSelection(root)) focusSpan();
            void uploadFiles(files);
          }
        }}
      />

      {!source && (
        <div className="editor-area">
          {!value.trim() && (
            <p className="editor-hint" aria-hidden="true">
              Tulis isi berita di sini. Pilih teks lalu pakai tombol di atas, atau ketik “## ” untuk judul dan “- ” untuk daftar.
            </p>
          )}
          <div
            ref={rich}
            className="editor-rich prose"
            contentEditable
            suppressContentEditableWarning
            spellCheck
            role="textbox"
            aria-multiline="true"
            aria-label="Isi"
            style={{ minHeight: `${rows * 1.6}em` }}
            onInput={onInput}
            onCompositionEnd={() => commit("typing")}
            onBlur={sync}
            onPaste={onPaste}
            onDrop={onDrop}
            onDragOver={(event: React.DragEvent<HTMLDivElement>) => {
              if (Array.from(event.dataTransfer.items).some((item) => item.kind === "file")) event.preventDefault();
            }}
            onKeyDown={onKeyDown}
            onMouseDown={() => {
              history.current.kind = "";
            }}
          />
        </div>
      )}
      {/* Isi yang dikirim bersama form selalu berupa Markdown di kotak ini. */}
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        hidden={!source}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Markdown: ## judul, **tebal**, *miring*, ~~coret~~, - daftar, > kutipan, [teks](tautan), --- garis"
      />

      <div className="editor-foot" aria-live="polite">
        <span>
          {words.toLocaleString("id-ID")} kata · ±{minutes} menit baca
        </span>
        <span className="editor-keys">
          {source
            ? "## judul · **tebal** · *miring* · ~~coret~~ · - daftar · > kutipan · [teks](tautan) · --- garis"
            : `${mod}+B tebal · ${mod}+I miring · ${mod}+K tautan · ${mod}+Z urungkan · ${mod}+Shift+Z ulangi`}
        </span>
      </div>
    </div>
  );
}
