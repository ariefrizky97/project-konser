"use client";

import { useState } from "react";
import { youtubeId, youtubeThumb } from "@/lib/youtube";
import { Thumb } from "./Thumb";

/**
 * Isian tautan YouTube dengan pratinjau gambar videonya, supaya admin langsung tahu
 * tautannya dikenali sebelum menyimpan.
 */
export function VideoField({ name, defaultValue = "" }: { name: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const id = youtubeId(value);
  const typed = value.trim() !== "";

  return (
    <div className="videofield">
      <input
        id={name}
        name={name}
        type="text"
        inputMode="url"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="https://youtu.be/…"
        maxLength={300}
        aria-invalid={typed && !id ? true : undefined}
      />
      {id && (
        <div className="videofield-preview">
          <Thumb src={youtubeThumb(id)} alt="Pratinjau video YouTube" />
          <span className="videofield-badge">Video dikenali</span>
        </div>
      )}
      {typed && !id && (
        <p className="field-error" role="alert">
          Bukan tautan YouTube yang dikenali. Contoh: https://youtu.be/dQw4w9WgXcQ
        </p>
      )}
    </div>
  );
}
