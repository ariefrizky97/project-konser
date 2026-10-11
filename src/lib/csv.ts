/** Susun baris menjadi CSV. Nilai yang berisi koma, kutip, atau baris baru diapit kutip. */
export function toCsv(rows: (string | number)[][]): string {
  const cell = (value: string | number) => {
    let text = String(value);
    // Cegah rumus dijalankan saat berkas dibuka di aplikasi lembar kerja.
    if (/^[=+\-@]/.test(text) && typeof value === "string") text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** Jawaban unduhan CSV dengan nama berkas. BOM di depan supaya Excel membaca UTF-8 dengan benar. */
export function csvResponse(filename: string, rows: (string | number)[][]): Response {
  return new Response(`﻿${toCsv(rows)}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename.replace(/[^\w.-]+/g, "-")}"`,
      "cache-control": "no-store",
    },
  });
}
