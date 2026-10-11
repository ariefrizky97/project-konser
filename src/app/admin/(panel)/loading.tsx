// Kerangka pemuatan halaman admin, tampil selama data diambil.
export default function AdminLoading() {
  return (
    <div className="sk-page" role="status" aria-label="Memuat halaman">
      <div className="sk sk-title" />
      <div className="sk sk-line" style={{ width: "42%" }} />
      <div className="sk-rows">
        {Array.from({ length: 7 }, (_, index) => (
          <div className="sk sk-row" key={index} />
        ))}
      </div>
    </div>
  );
}
