import Link from "next/link";

/** Navigasi halaman. `hrefFor` menerima nomor halaman dan mengembalikan alamatnya. */
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const numbers: number[] = [];
  for (let n = Math.max(1, page - 2); n <= Math.min(totalPages, page + 2); n += 1) numbers.push(n);

  return (
    <nav className="pager" aria-label="Halaman">
      {page > 1 ? (
        <Link className="chip" href={hrefFor(page - 1)} rel="prev">
          Sebelumnya
        </Link>
      ) : (
        <span className="chip chip--off">Sebelumnya</span>
      )}
      {numbers.map((n) => (
        <Link key={n} className="chip" href={hrefFor(n)} aria-current={n === page ? "page" : undefined}>
          {n}
        </Link>
      ))}
      {page < totalPages ? (
        <Link className="chip" href={hrefFor(page + 1)} rel="next">
          Berikutnya
        </Link>
      ) : (
        <span className="chip chip--off">Berikutnya</span>
      )}
    </nav>
  );
}
