"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="wrap blank">
      <h1 className="blank-title">Halaman gagal dimuat</h1>
      <p>Coba muat ulang. Bila masih gagal, kemungkinan database sedang tidak tersambung.</p>
      {process.env.NODE_ENV !== "production" && (
        <p className="blank-hint">
          Untuk pengembang: periksa DATABASE_URL di file .env, lalu jalankan <code>npm run db:setup</code>.
        </p>
      )}
      <div className="blank-actions">
        <button type="button" className="btn" onClick={() => reset()}>
          Muat ulang
        </button>
      </div>
    </main>
  );
}
