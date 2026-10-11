// Kerangka pemuatan halaman publik. Tampil saat berpindah halaman sampai isi siap,
// paling singkat selama SKELETON_MS (lihat src/lib/skeleton.ts).
export default function SiteLoading() {
  return (
    <div className="wrap sk-page" role="status" aria-label="Memuat halaman">
      <div className="sk-hero">
        <div className="sk sk-media" />
        <div className="sk-side">
          <div className="sk sk-title" />
          {Array.from({ length: 4 }, (_, index) => (
            <div className="sk sk-row" key={index} />
          ))}
        </div>
      </div>
      <div className="sk sk-title" />
      <div className="grid3">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="sk-card" key={index}>
            <div className="sk sk-thumb" />
            <div className="sk sk-line" style={{ width: "34%" }} />
            <div className="sk sk-line" />
            <div className="sk sk-line" style={{ width: "72%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
