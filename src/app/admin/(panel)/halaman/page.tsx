import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/admin/Flash";
import { PageHead, StatusBadge } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { listPages } from "@/lib/queries";

export const metadata: Metadata = { title: "Halaman" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminPagesPage({ searchParams }: Props) {
  await requireUser();
  const [query, pages] = await Promise.all([searchParams, listPages()]);

  return (
    <>
      <PageHead
        title="Halaman"
        description="Halaman tetap seperti Kebijakan Privasi, Pedoman Media Siber, atau Redaksi. Halaman yang terbit bisa ditautkan dari kaki situs dan dari menu navbar."
        action={{ href: "/admin/halaman/baru", label: "Buat halaman" }}
      />
      <Flash query={query} />
      {pages.length === 0 ? (
        <p className="panel-empty panel">Belum ada halaman.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Alamat</th>
                <th>Status</th>
                <th>Kaki situs</th>
                <th>Diubah</th>
                <th>
                  <span className="sr">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td className="cell-title">
                    <Link href={`/admin/halaman/${page.id}`}>{page.title}</Link>
                  </td>
                  <td>/halaman/{page.slug}</td>
                  <td>
                    <StatusBadge status={page.status} />
                  </td>
                  <td>{page.in_footer ? "Ya" : "Tidak"}</td>
                  <td>{formatDate(page.updated_at)}</td>
                  <td className="cell-actions">
                    <Link href={`/admin/halaman/${page.id}`} className="link">
                      Sunting
                    </Link>
                    {page.status === "published" && (
                      <Link href={`/halaman/${page.slug}`} className="link" target="_blank">
                        Lihat
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
