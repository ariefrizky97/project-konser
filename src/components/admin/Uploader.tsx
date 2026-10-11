"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Spinner } from "@/components/site/Spinner";
import { toast } from "@/lib/toast";
import { uploadImage } from "./upload";

/** Unggah satu atau beberapa gambar ke ImageKit dari halaman Media. */
export function Uploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [label, setLabel] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    let done = 0;
    for (const file of Array.from(files)) {
      setLabel(files.length > 1 ? `${file.name} (${done + 1} dari ${files.length})` : file.name);
      setProgress(0);
      try {
        await uploadImage(file, setProgress);
        done += 1;
      } catch (error) {
        void toast(`${file.name}: ${(error as Error).message}`, "error");
      }
    }
    setProgress(null);
    if (input.current) input.current.value = "";
    if (done > 0) {
      void toast(done > 1 ? `${done} gambar diunggah.` : "Gambar diunggah.");
      router.refresh();
    }
  }

  const busy = progress !== null;

  return (
    <div className="upload panel">
      <input
        ref={input}
        id="file"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple
        hidden
        onChange={(event) => void onFiles(event.target.files)}
      />
      <button type="button" className="btn" disabled={busy} onClick={() => input.current?.click()}>
        {busy && <Spinner label="Mengunggah" />}
        {busy ? "Mengunggah…" : "Unggah gambar"}
      </button>
      {busy ? (
        <div className="upload-status" role="status">
          <span className="upload-name">{label}</span>
          <span className="progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </span>
          <span className="upload-percent">{progress}%</span>
        </div>
      ) : (
        <p className="field-hint">
          Gambar disimpan di ImageKit. JPG, PNG, WebP, GIF, atau AVIF, maksimal 10 MB per gambar. Video tidak
          diunggah: tempel tautan YouTube di form artikel atau slide.
        </p>
      )}
    </div>
  );
}
