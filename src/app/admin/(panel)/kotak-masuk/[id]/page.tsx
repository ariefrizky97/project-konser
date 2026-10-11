import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Flash } from "@/components/admin/Flash";
import { PageHead } from "@/components/admin/ui";
import { approveEvent, handleMessage } from "@/lib/actions/inbox";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatEventRange, fromInputValue, relativeTime } from "@/lib/format";
import { getMessageById } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { MESSAGE_LABELS } from "@/lib/types";

export const metadata: Metadata = { title: "Baca pesan" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MessagePage({ params, searchParams }: Props) {
  await requireUser();
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();
  const [query, message, settings] = await Promise.all([searchParams, getMessageById(Number(id)), getSettings()]);
  if (!message) notFound();

  const data = message.payload ?? {};
  const start = fromInputValue(data.starts_at ?? "");
  const facts = [
    ["Waktu", start ? formatEventRange(start, fromInputValue(data.ends_at ?? ""), false) : ""],
    ["Tempat", [data.venue_name, data.city].filter(Boolean).join(", ")],
    ["Harga", data.price_info ?? ""],
    ["Tautan tiket", data.ticket_url ?? ""],
    ["Penyelenggara", data.organizer_name ?? ""],
  ].filter(([, value]) => value);

  // Balasan dibuka di tab baru: lewat Gmail di browser, atau lewat aplikasi email perangkat.
  const subject = `Re: ${message.subject}`;
  const quote = `\n\n---\nPada ${formatDateTime(message.created_at)}, ${message.name} menulis:\n${message.body}`;
  const body = `Halo ${message.name},\n\n\n\nSalam,\n${settings.site_name}${quote}`;
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(message.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const mailto = `mailto:${message.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const fresh = message.status === "baru";

  return (
    <>
      <PageHead title={message.subject} description={`${MESSAGE_LABELS[message.kind]} dari ${message.name}, ${relativeTime(message.created_at)}.`} />
      <Flash query={query} />
      <p className="adm-sublink">
        <Link href="/admin/kotak-masuk" className="link">
          Kembali ke kotak masuk
        </Link>
      </p>

      <div className="adm-cols message">
        <section className="panel">
          <dl className="message-head">
            <div>
              <dt>Dari</dt>
              <dd>{message.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={gmail} target="_blank" rel="noopener noreferrer">
                  {message.email}
                </a>
              </dd>
            </div>
            {message.phone && (
              <div>
                <dt>Telepon</dt>
                <dd>
                  <a href={`https://wa.me/${message.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer">
                    {message.phone}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt>Diterima</dt>
              <dd>{formatDateTime(message.created_at)}</dd>
            </div>
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="message-body">{message.body || "Tanpa keterangan."}</div>
        </section>

        <section className="panel message-side">
          <div className="panel-head">
            <h2>Tindak lanjut</h2>
            {message.status === "selesai" && <span className="badge badge--ok">Selesai</span>}
            {message.status === "ditolak" && <span className="badge">Ditolak</span>}
            {fresh && <span className="badge badge--note">Belum ditangani</span>}
          </div>
          <a href={gmail} target="_blank" rel="noopener noreferrer" className="btn">
            Balas lewat Gmail (tab baru)
          </a>
          <a href={mailto} target="_blank" rel="noopener noreferrer" className="btn btn--line">
            Balas lewat aplikasi email
          </a>
          {message.handled_by && <p className="field-hint">Ditangani oleh {message.handled_by}.</p>}
          {message.event_id && (
            <Link href={`/admin/event/${message.event_id}`} className="chip">
              Buka event yang dibuat
            </Link>
          )}
          <div className="message-acts">
            {fresh && message.kind === "event" && (
              <form action={approveEvent}>
                <input type="hidden" name="id" value={message.id} />
                <button type="submit" className="chip chip--sun">
                  Setujui jadi event
                </button>
              </form>
            )}
            {(["selesai", "ditolak", "baru"] as const)
              .filter((aksi) => aksi !== message.status && !(aksi === "ditolak" && message.kind !== "event"))
              .map((aksi) => (
                <form action={handleMessage} key={aksi}>
                  <input type="hidden" name="id" value={message.id} />
                  <input type="hidden" name="aksi" value={aksi} />
                  <button type="submit" className="chip">
                    {aksi === "selesai" ? "Tandai selesai" : aksi === "ditolak" ? "Tolak" : "Buka lagi"}
                  </button>
                </form>
              ))}
            <form action={handleMessage}>
              <input type="hidden" name="id" value={message.id} />
              <input type="hidden" name="aksi" value="hapus" />
              <ConfirmButton label="Hapus" message={`Hapus kiriman "${message.subject}"?`} />
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
