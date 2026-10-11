// Lama minimum kerangka pemuatan (skeleton) tampil saat halaman publik dibuka.
// Bawaannya 1 detik. Atur SKELETON_MS=0 di .env untuk mematikannya.
const configured = Number(process.env.SKELETON_MS ?? 1000);
const SKELETON_MS = Number.isFinite(configured) ? Math.min(Math.max(configured, 0), 5000) : 1000;

/**
 * Dipanggil bersama pengambilan data di halaman publik:
 *   const [data] = await Promise.all([ambilData(), skeletonDelay()]);
 * Jeda berjalan berbarengan dengan query, jadi total tunggu adalah yang terlama dari keduanya.
 */
export function skeletonDelay(): Promise<void> {
  if (SKELETON_MS === 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, SKELETON_MS));
}
