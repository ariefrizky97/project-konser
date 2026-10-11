import Link from "next/link";

export function NotFoundBody() {
  return (
    <div className="wrap blank">
      <p className="blank-code">404</p>
      <h1 className="blank-title">Halaman ini tidak ada</h1>
      <p>Alamatnya mungkin salah ketik, atau kontennya sudah dipindahkan.</p>
      <div className="blank-actions">
        <Link href="/" className="btn">
          Ke beranda
        </Link>
        <Link href="/cari" className="btn btn--line">
          Cari konten
        </Link>
      </div>
    </div>
  );
}
