import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Flash } from "@/components/admin/Flash";
import { PageHead, StatusBadge } from "@/components/admin/ui";
import { deleteEvent } from "@/lib/actions/events";
import { requireUser } from "@/lib/auth";
import { formatEventRange, param } from "@/lib/format";
import { adminListEvents } from "@/lib/queries";

export const metadata: Metadata = { title: "Event" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminEventsPage({ searchParams }: Props) {
  await requireUser();
  const query = await searchParams;
  const keyword = param(query.q);
  const events = await adminListEvents(keyword || undefined);
  const now = new Date();

  return (
    <>
      <PageHead title="Event" action={{ href: "/admin/event/baru", label: "Tambah event" }} />
      <Flash query={query} />

      <form className="filter" action="/admin/event">
        <label className="sr" htmlFor="q">
          Cari nama event
        </label>
        <input id="q" name="q" type="search" defaultValue={keyword} placeholder="Cari nama event" />
        <button type="submit" className="chip">
          Cari
        </button>
      </form>

      {events.length === 0 ? (
        <p className="panel-empty panel">Tidak ada event yang cocok.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nama event</th>
                <th>Tipe</th>
                <th>Tanggal</th>
                <th>Tempat</th>
                <th>Status</th>
                <th>
                  <span className="sr">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const end = event.ends_at ?? event.starts_at;
                return (
                  <tr key={event.id} className={end < now ? "row-past" : undefined}>
                    <td className="cell-title">
                      <Link href={`/admin/event/${event.id}`}>{event.title}</Link>
                    </td>
                    <td>{event.type_name ?? "Tanpa tipe"}</td>
                    <td>{formatEventRange(event.starts_at, event.ends_at, event.all_day)}</td>
                    <td>{[event.venue_name, event.city].filter(Boolean).join(", ")}</td>
                    <td>
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="cell-actions">
                      <Link href={`/admin/event/${event.id}`} className="link">
                        Sunting
                      </Link>
                      {event.status === "published" && (
                        <Link href={`/event/${event.slug}`} className="link" target="_blank">
                          Lihat
                        </Link>
                      )}
                      <form action={deleteEvent}>
                        <input type="hidden" name="id" value={event.id} />
                        <ConfirmButton label="Hapus" message={`Hapus event "${event.title}"?`} />
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
