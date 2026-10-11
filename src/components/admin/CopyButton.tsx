"use client";

import { useState } from "react";

/** Menyalin teks ke papan klip, misalnya alamat gambar. */
export function CopyButton({ text, label = "Salin alamat" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Salin alamat ini:", text);
    }
  }

  return (
    <button type="button" className="link" onClick={copy}>
      <span aria-live="polite">{copied ? "Tersalin" : label}</span>
    </button>
  );
}
