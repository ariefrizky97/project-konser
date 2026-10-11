import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Flash } from "@/components/admin/Flash";
import { PageHead, StatusBadge } from "@/components/admin/ui";
import { deleteDirectoryEntry } from "@/lib/actions/directory";
import { requireUser } from "@/lib/auth";
import { param } from "@/lib/format";
import { adminListDirectory } from "@/lib/queries";
import { DIRECTORY_LABELS } from "@/lib/types";

export const metadata: Metadata = { title: "Direktori" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminDirectoryPage({ searchParams }: Props) {
  await requireUser();
  const query = await searchParams;
  const keyword = param(query.q);
  const entries = await adminListDirectory(keyword || undefined);

  return (
    <>
      <PageHead title="Direktori" action={{ href: "/admin/direktori/baru", label: "Tambah entri" }} />
      <Flash query={query} />

      <form className="filter" action="/admin/direktori">
        <label className="sr" htmlFor="q">
          Cari nama
        </label>
        <input id="q" name="q" type="search" defaultValue={keyword} placeholder="Cari nama" />
        <button type="submit" className="chip">
          Cari
        </button>
      </form>

      {entries.length === 0 ? (
        <p className="panel-empty panel">Tidak ada entri yang cocok.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Jenis</th>
                <th>Kota</th>
                <th>Status</th>
                <th>
                  <span className="sr">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="cell-title">
                    <Link href={`/admin/direktori/${entry.id}`}>{entry.name}</Link>
                  </td>
                  <td>{DIRECTORY_LABELS[entry.kind]}</td>
                  <td>{entry.city}</td>
                  <td>
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="cell-actions">
                    <Link href={`/admin/direktori/${entry.id}`} className="link">
                      Sunting
                    </Link>
                    {entry.status === "published" && (
                      <Link href={`/direktori/${entry.slug}`} className="link" target="_blank">
                        Lihat
                      </Link>
                    )}
                    <form action={deleteDirectoryEntry}>
                      <input type="hidden" name="id" value={entry.id} />
                      <ConfirmButton label="Hapus" message={`Hapus "${entry.name}" dari direktori?`} />
                    </form>
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
