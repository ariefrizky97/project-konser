"use client";

import { useState } from "react";

export type EditorLink = { label: string; href: string };

/**
 * Daftar tautan yang bisa ditambah, dihapus, dan diurutkan dengan tombol naik turun.
 * Nilainya dikirim bersama form sebagai JSON di isian tersembunyi bernama `name`.
 */
export function MenuEditor({
  name,
  initial,
  max,
  labelName,
  hrefHint,
  hrefRequired,
  suggestions = [],
}: {
  name: string;
  initial: EditorLink[];
  max: number;
  /** Nama isian pertama, misalnya "Nama menu" atau "Teks". */
  labelName: string;
  hrefHint: string;
  hrefRequired: boolean;
  /** Pilihan cepat yang bisa ditambahkan dengan satu ketukan. */
  suggestions?: EditorLink[];
}) {
  const [items, setItems] = useState(initial);
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");

  const move = (index: number, by: number) => {
    const target = index + by;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };
  const add = (link: EditorLink) => {
    if (!link.label.trim() || (hrefRequired && !link.href.trim()) || items.length >= max) return;
    setItems([...items, { label: link.label.trim(), href: link.href.trim() }]);
  };
  const unused = suggestions.filter((option) => !items.some((item) => item.href === option.href && item.label === option.label));

  return (
    <div className="menued">
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      {items.length === 0 && <p className="field-hint">Belum ada isi.</p>}
      <ol className="menued-list">
        {items.map((item, index) => (
          <li key={`${item.label}|${item.href}|${index}`} className="menued-item">
            <span className="menued-order">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Naikkan ${item.label}`}>
                ↑
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Turunkan ${item.label}`}>
                ↓
              </button>
            </span>
            <span className="menued-label">{item.label}</span>
            <small className="menued-href">{item.href || "tanpa tautan"}</small>
            <button type="button" className="link-danger" onClick={() => setItems(items.filter((_, at) => at !== index))} aria-label={`Hapus ${item.label}`}>
              Hapus
            </button>
          </li>
        ))}
      </ol>

      {items.length < max && (
        <div className="menued-add">
          <input type="text" value={label} onChange={(event) => setLabel(event.target.value)} placeholder={labelName} maxLength={160} aria-label={labelName} />
          <input type="text" value={href} onChange={(event) => setHref(event.target.value)} placeholder={hrefHint} maxLength={300} aria-label="Alamat tautan" />
          <button
            type="button"
            className="chip"
            onClick={() => {
              add({ label, href });
              setLabel("");
              setHref("");
            }}
          >
            Tambah
          </button>
        </div>
      )}
      {unused.length > 0 && items.length < max && (
        <p className="menued-quick">
          <span>Tambah cepat:</span>
          {unused.slice(0, 8).map((option) => (
            <button type="button" key={`${option.label}|${option.href}`} className="chip" onClick={() => add(option)}>
              {option.label}
            </button>
          ))}
        </p>
      )}
    </div>
  );
}
