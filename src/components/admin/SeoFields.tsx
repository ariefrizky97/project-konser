"use client";

import { useEffect, useRef, useState } from "react";

const TITLE_MAX = 60;
const DESC_MAX = 155;

function Meter({ length, max }: { length: number; max: number }) {
  const state = length === 0 ? "kosong" : length > max ? "lebih" : length < max * 0.5 ? "pendek" : "pas";
  const note =
    state === "kosong"
      ? "Kosong: memakai judul atau ringkasan artikel."
      : state === "lebih"
        ? `${length} dari ${max} karakter. Terlalu panjang, ujungnya akan terpotong.`
        : state === "pendek"
          ? `${length} dari ${max} karakter. Masih bisa lebih lengkap.`
          : `${length} dari ${max} karakter. Panjangnya pas.`;
  return (
    <>
      <span className={`meter meter--${state}`} aria-hidden="true">
        <i style={{ width: `${Math.min(100, (length / max) * 100)}%` }} />
      </span>
      <p className="field-hint">{note}</p>
    </>
  );
}

/**
 * Judul dan deskripsi untuk mesin pencari, dengan pratinjau tampilannya di hasil pencarian.
 * Bila dikosongkan, pratinjau mengikuti judul dan ringkasan yang sedang diketik di form.
 */
export function SeoFields({
  defaultTitle,
  defaultDescription,
  siteName,
  host,
}: {
  defaultTitle: string;
  defaultDescription: string;
  siteName: string;
  host: string;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [fallback, setFallback] = useState({ title: "", excerpt: "", slug: "" });

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    const read = () => {
      const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value?.trim() ?? "";
      setFallback({ title: value("title"), excerpt: value("excerpt"), slug: value("slug") });
    };
    read();
    form.addEventListener("input", read);
    return () => form.removeEventListener("input", read);
  }, []);

  const shownTitle = title.trim() || fallback.title || "Judul artikel";
  const shownDescription = description.trim() || fallback.excerpt || "Ringkasan artikel akan tampil di sini.";
  const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

  return (
    <div className="seo" ref={anchor}>
      <div className="field">
        <label className="field-label" htmlFor="seo_title">
          Judul untuk mesin pencari
        </label>
        <input id="seo_title" name="seo_title" type="text" value={title} maxLength={70} onChange={(event) => setTitle(event.target.value)} />
        <Meter length={title.trim().length} max={TITLE_MAX} />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="seo_description">
          Deskripsi
        </label>
        <textarea id="seo_description" name="seo_description" rows={2} value={description} maxLength={170} onChange={(event) => setDescription(event.target.value)} />
        <Meter length={description.trim().length} max={DESC_MAX} />
      </div>
      <p className="field-label">Pratinjau di hasil pencarian</p>
      <div className="seo-preview">
        <p className="seo-url">
          {host} › berita{fallback.slug ? ` › ${fallback.slug}` : ""}
        </p>
        <p className="seo-title">{cut(`${shownTitle} | ${siteName}`, 70)}</p>
        <p className="seo-desc">{cut(shownDescription, DESC_MAX)}</p>
      </div>
    </div>
  );
}
