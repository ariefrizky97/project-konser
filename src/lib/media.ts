/**
 * Minta ImageKit mengirim gambar dengan lebar tertentu supaya halaman ringan.
 * Alamat di luar ImageKit dikembalikan apa adanya.
 */
export function sized(url: string, width: number): string {
  if (!/^https:\/\/ik\.imagekit\.io\//i.test(url) || /[?&]tr=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}tr=w-${width},q-80`;
}

/**
 * Gambar kecil untuk daftar dan pustaka media. Dibuat dari alamat aslinya, jadi tidak
 * bergantung pada alamat thumbnail yang dikirim ImageKit saat unggah.
 */
export function thumb(url: string, width = 400): string {
  return sized(url, width);
}
