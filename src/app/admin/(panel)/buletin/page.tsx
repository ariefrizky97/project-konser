import type { Metadata } from "next";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Flash } from "@/components/admin/Flash";
import { PageHead } from "@/components/admin/ui";
import { deleteSubscriber } from "@/lib/actions/newsletter";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { listSubscribers } from "@/lib/queries";

export const metadata: Metadata = { title: "Buletin" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewsletterPage({ searchParams }: Props) {
  await requireUser();
  const [query, subscribers] = await Promise.all([searchParams, listSubscribers()]);
  const week = subscribers.filter((row) => Date.now() - row.created_at.getTime() < 7 * 86_400_000).length;

  return (
    <>
      <PageHead
        title="Buletin"
        description="Daftar email yang mendaftar lewat kotak langganan di kaki situs. Pengiriman buletinnya dilakukan dari layanan email Anda: unduh daftar ini lalu impor ke sana."
      />
      <Flash query={query} />

      <div className="stats">
        <div className="stat stat--plain">
          <span className="stat-value">{subscribers.length.toLocaleString("id-ID")}</span>
          <span className="stat-label">Pelanggan</span>
          <span className="stat-note">{week} baru dalam 7 hari</span>
        </div>
        <a className="stat" href="/admin/buletin/unduh">
          <span className="stat-value">CSV</span>
          <span className="stat-label">Unduh daftar pelanggan</span>
          <span className="stat-note">Bisa diimpor ke Mailchimp, Brevo, dan sejenisnya</span>
        </a>
      </div>

      {subscribers.length === 0 ? (
        <p className="panel-empty panel traffic">Belum ada pelanggan.</p>
      ) : (
        <div className="table-wrap traffic">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Terdaftar</th>
                <th>
                  <span className="sr">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {subscribers.slice(0, 500).map((row) => (
                <tr key={row.id}>
                  <td className="cell-title">{row.email}</td>
                  <td>{formatDate(row.created_at)}</td>
                  <td className="cell-actions">
                    <form action={deleteSubscriber}>
                      <input type="hidden" name="id" value={row.id} />
                      <ConfirmButton label="Hapus" message={`Hapus ${row.email} dari daftar?`} />
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
