"use client";

import { useRef, useState } from "react";

const MAX_BYTES = 50 * 1024 * 1024;

/**
 * Form pulihkan cadangan. Pemeriksaan di sini hanya membantu (berkas .json, ukuran, kalimat
 * konfirmasi, centang); semuanya diperiksa ulang di server.
 */
export function RestoreForm({ phrase }: { phrase: string }) {
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const fileError = !file
    ? ""
    : !/\.json$/i.test(file.name)
      ? "Pilih berkas .json hasil unduhan cadangan."
      : file.size > MAX_BYTES
        ? "Berkas melebihi 50 MB."
        : "";
  const ready = Boolean(file) && !fileError && typed === phrase && checked;

  return (
    <form
      className="bkp-restore"
      action="/admin/cadangan/pulihkan"
      method="post"
      encType="multipart/form-data"
      onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
        if (!ready) {
          event.preventDefault();
          return;
        }
        setSending(true);
      }}
    >
      <label
        className={`bkp-drop${dragging ? " is-over" : ""}${file && !fileError ? " is-ready" : ""}${fileError ? " is-bad" : ""}`}
        htmlFor="bkp-file"
        onDragOver={(event: React.DragEvent<HTMLLabelElement>) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event: React.DragEvent<HTMLLabelElement>) => {
          event.preventDefault();
          setDragging(false);
          const dropped = event.dataTransfer.files;
          if (dropped.length && input.current) {
            input.current.files = dropped;
            setFile({ name: dropped[0].name, size: dropped[0].size });
          }
        }}
      >
        <input
          ref={input}
          id="bkp-file"
          className="bkp-drop-input"
          name="berkas"
          type="file"
          accept=".json,application/json"
          required
          aria-invalid={fileError ? true : undefined}
          aria-describedby="bkp-file-hint"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const chosen = event.target.files?.[0];
            setFile(chosen ? { name: chosen.name, size: chosen.size } : null);
          }}
        />
        <span className="bkp-drop-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V5m-5 5 5-5 5 5M5 20h14" />
          </svg>
        </span>
        <span className="bkp-drop-text">
          {file ? <strong>{file.name}</strong> : <strong>Pilih atau seret berkas backup ke sini</strong>}
          <small id="bkp-file-hint" className={fileError ? "field-error" : undefined}>
            {fileError || (file ? `${(file.size / 1024).toLocaleString("id-ID", { maximumFractionDigits: 0 })} KB · klik untuk mengganti` : "Berkas .json hasil Backup, paling besar 50 MB")}
          </small>
        </span>
      </label>
      <div className="field">
        <label className="field-label" htmlFor="bkp-konfirmasi">
          Ketik <code>{phrase}</code> untuk memastikan
        </label>
        <input
          id="bkp-konfirmasi"
          name="konfirmasi"
          type="text"
          autoComplete="off"
          spellCheck={false}
          required
          value={typed}
          aria-invalid={typed && typed !== phrase ? true : undefined}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTyped(event.target.value)}
        />
        {typed && typed !== phrase && <p className="field-error">Ketik persis {phrase}, huruf besar semua.</p>}
      </div>
      <label className="check">
        <input
          type="checkbox"
          name="sudah_unduh"
          value="ya"
          checked={checked}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setChecked(event.target.checked)}
        />
        <span>Saya sudah membuat backup terbaru. Semua isi situs saat ini akan diganti dengan isi berkas ini.</span>
      </label>
      <button type="submit" className="btn btn--danger" disabled={!ready || sending} aria-busy={sending}>
        {sending ? "Memulihkan…" : "Restore dari berkas ini"}
      </button>
    </form>
  );
}
