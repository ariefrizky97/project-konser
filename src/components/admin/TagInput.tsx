"use client";

import { useState } from "react";

function clean(token: string): string {
  return token.replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 40);
}

/**
 * Isian tagar. Ketik lalu tekan Enter, koma, atau spasi untuk menambah;
 * Backspace pada isian kosong menghapus tagar terakhir.
 * Nilainya dikirim lewat input tersembunyi sebagai daftar berpemisah koma.
 */
export function TagInput({
  name,
  defaultValue = [],
  suggestions = [],
}: {
  name: string;
  defaultValue?: string[];
  suggestions?: string[];
}) {
  const [tags, setTags] = useState(defaultValue);
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const next = [...tags];
    for (const token of raw.split(/[\s,]+/)) {
      const tag = clean(token);
      if (tag && next.length < 12 && !next.some((item) => item.toLowerCase() === tag.toLowerCase())) {
        next.push(tag);
      }
    }
    setTags(next);
    setDraft("");
  }

  // Yang sedang diketik ikut terkirim, supaya tagar tidak hilang bila pengguna langsung menyimpan.
  const value = [...tags, clean(draft)].filter(Boolean).join(",");

  return (
    <div className="tags-input">
      <input type="hidden" name={name} value={value} />
      {tags.map((tag) => (
        <span className="tags-chip" key={tag}>
          #{tag}
          <button
            type="button"
            onClick={() => setTags(tags.filter((item) => item !== tag))}
            aria-label={`Hapus tagar ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={name}
        type="text"
        value={draft}
        list={`${name}-saran`}
        placeholder={tags.length ? "Tambah tagar" : "contoh: konser, Jakarta"}
        autoComplete="off"
        onChange={(event) => {
          const text = event.target.value;
          if (/[\s,]/.test(text)) add(text);
          else setDraft(text);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            // Enter menambah tagar, bukan mengirim form.
            event.preventDefault();
            add(draft);
          } else if (event.key === "Backspace" && !draft && tags.length) {
            setTags(tags.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
      />
      <datalist id={`${name}-saran`}>
        {suggestions
          .filter((item) => !tags.includes(item))
          .map((item) => (
            <option key={item} value={item} />
          ))}
      </datalist>
    </div>
  );
}
