"use client";

import { useEffect, useState } from "react";

/**
 * Gambar kecil di admin. Bila versi kecilnya gagal dimuat, dicoba alamat aslinya;
 * bila itu juga gagal, tampil kotak keterangan, bukan ikon gambar rusak.
 */
export function Thumb({ src, fallback, alt }: { src: string; fallback?: string; alt: string }) {
  const [current, setCurrent] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrent(src);
    setFailed(false);
  }, [src]);

  if (!current || failed) {
    return <span className="thumb-empty">{current ? "Gambar tidak bisa dimuat" : "Tanpa gambar"}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (fallback && current !== fallback) setCurrent(fallback);
        else setFailed(true);
      }}
    />
  );
}
