/** Indikator aktivitas: lingkaran berputar. Mengikuti warna teks di sekitarnya. */
export function Spinner({ label = "Memuat", large = false }: { label?: string; large?: boolean }) {
  return <span className={`spinner${large ? " spinner--large" : ""}`} role="status" aria-label={label} />;
}
