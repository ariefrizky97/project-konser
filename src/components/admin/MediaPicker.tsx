"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/site/Spinner";
import { thumb } from "@/lib/media";
import { toast } from "@/lib/toast";
import { Thumb } from "./Thumb";
import { uploadImage } from "./upload";

export type PickerItem = { id: number; filename: string; url: string; thumb: string };

/**
 * Isian gambar: pilih dari pustaka media, unggah langsung ke ImageKit, atau tempel alamat.
 * Nilainya berupa alamat gambar (https://ik.imagekit.io/… atau alamat https:// lain).
 */
export function MediaPicker({
  name,
  defaultValue = "",
  items,
  onChange,
  preview = true,
}: {
  name: string;
  defaultValue?: string;
  items: PickerItem[];
  /** Dipanggil setiap kali gambar terpilih berubah. */
  onChange?: (value: string) => void;
  /** Tampilkan pratinjau besar gambar terpilih. */
  preview?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    onChange?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const [library, setLibrary] = useState(items);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = progress !== null;

  async function upload(file: File) {
    setProgress(0);
    setMessage("");
    try {
      const result = await uploadImage(file, setProgress);
      setLibrary([{ id: result.id, filename: result.filename, url: result.url, thumb: result.thumb }, ...library]);
      setValue(result.url);
      setOpen(false);
      void toast("Gambar diunggah.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setProgress(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="picker">
      {value && preview && (
        <div className="picker-preview">
          <Thumb src={thumb(value, 800)} fallback={value} alt="Pratinjau gambar terpilih" />
        </div>
      )}
      <input
        id={name}
        name={name}
        type="text"
        inputMode="url"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Pilih, unggah, atau tempel alamat https://…"
      />
      <div className="picker-actions">
        <button type="button" className="chip" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "Tutup pustaka" : "Pilih dari media"}
        </button>
        <button type="button" className="chip" onClick={() => fileInput.current?.click()} disabled={busy}>
          {busy && <Spinner label="Mengunggah" />}
          {busy ? `Mengunggah ${progress}%` : "Unggah gambar"}
        </button>
        {value && (
          <button type="button" className="chip" onClick={() => setValue("")}>
            Lepas gambar
          </button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>
      {busy && (
        <span className="progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </span>
      )}
      {message && (
        <p className="field-error" role="alert">
          {message}
        </p>
      )}
      {open && (
        <div className="picker-grid">
          {library.length === 0 && <p className="field-hint">Pustaka masih kosong. Unggah gambar pertama.</p>}
          {library.map((item) => (
            <button
              type="button"
              key={item.id}
              className="picker-item"
              aria-pressed={value === item.url}
              title={item.filename}
              onClick={() => {
                setValue(item.url);
                setOpen(false);
              }}
            >
              <Thumb src={item.thumb || item.url} fallback={item.url} alt={item.filename} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
