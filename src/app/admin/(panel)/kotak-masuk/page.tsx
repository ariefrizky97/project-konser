import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Flash } from "@/components/admin/Flash";
import { PageHead } from "@/components/admin/ui";
import { approveEvent, handleMessage } from "@/lib/actions/inbox";
import { requireUser } from "@/lib/auth";
import { formatEventRange, fromInputValue, param, relativeTime } from "@/lib/format";
import { countMessages, listMessages } from "@/lib/queries";
import { MESSAGE_LABELS, type Message, type MessageKind } from "@/lib/types";

export const metadata: Metadata = { title: "Kotak masuk" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TONE: Record<MessageKind, string> = { event: "#c9694a", iklan: "#3f7c8c", pesan: "#7c8b4e" };

/** Ringkasan isi pengajuan event: tanggal, tempat, harga. */
function eventLine(message: Message): string {
  const data = message.payload ?? {};
  const start = fromInputValue(data.starts_at ?? "");
  const parts = [
    start ? formatEventRange(start, fromInputValue(data.ends_at ?? ""), false) : "",
    [data.venue_name, data.city].filter(Boolean).join(", "),
    data.price_info ?? "",
    data.organizer_name ? `oleh ${data.organizer_name}` : "",
  ];
  return parts.filter(Boolean).join(" · ");
}

function Action({ id, aksi, label, className = "chip" }: { id: number; aksi: string; label: string; className?: string }) {
  return (
    <form action={handleMessage}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="aksi" value={aksi} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}

export default async function InboxPage({ searchParams }: Props) {
  await requireUser();
  const query = await searchParams;
  const view = param(query.lihat);
  const kind = view === "event" || view === "iklan" || view === "pesan" ? view : undefined;
  const [messages, counts] = await Promise.all([
    listMessages({ kind, status: view === "baru" ? "baru" : undefined }),
    countMessages(),
  ]);

  const tabs = [
    { key: "", label: "Semua", count: counts.total },
    { key: "baru", label: "Belum ditangani", count: counts.baru },
    { key: "event", label: "Pengajuan event", count: counts.event },
    { key: "iklan", label: "Pasang iklan", count: counts.iklan },
    { key: "pesan", label: "Pesan", count: counts.pesan },
  ];

  return (
    <>
      <PageHead
        title="Kotak masuk"
        description="Pengajuan event, permintaan iklan, dan pesan dari form di situs publik. Pengajuan yang disetujui langsung menjadi draf event."
      />
      <Flash query={query} />

      <nav className="chips inbox-tabs" aria-label="Saring kotak masuk">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key ? `/admin/kotak-masuk?lihat=${tab.key}` : "/admin/kotak-masuk"}
            className="chip"
            aria-current={view === tab.key ? "page" : undefined}
          >
            {tab.label} <span className="chip-count">{tab.count}</span>
          </Link>
        ))}
      </nav>

      {messages.length === 0 ? (
        <p className="panel-empty panel">
          Belum ada kiriman di sini. Form publiknya ada di <Link href="/kirim-event" className="link">/kirim-event</Link>{" "}
          dan <Link href="/kontak" className="link">/kontak</Link>.
        </p>
      ) : (
        <ul className="panel inbox">
          {messages.map((message) => {
            const fresh = message.status === "baru";
            // Balasan dibuka di tab baru lewat Gmail; pilihan lain ada di halaman pesannya.
            const reply = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(message.email)}&su=${encodeURIComponent(`Re: ${message.subject}`)}`;
            return (
              <li key={message.id} className={`inbox-item${fresh ? " is-new" : ""}`}>
                <div className="inbox-main">
                  <h2 className="inbox-title">
                    {fresh && <span className="inbox-dot" aria-label="Belum ditangani" />}
                    <span className="tag" style={{ "--tone": TONE[message.kind] } as React.CSSProperties}>
                      {MESSAGE_LABELS[message.kind]}
                    </span>
                    <Link href={`/admin/kotak-masuk/${message.id}`} className="inbox-open">
                      {message.subject}
                    </Link>
                  </h2>
                  {message.kind === "event" && eventLine(message) && <p className="inbox-facts">{eventLine(message)}</p>}
                  {message.body && <p className="inbox-body">{message.body}</p>}
                  <Link href={`/admin/kotak-masuk/${message.id}`} className="inbox-read">
                    Baca selengkapnya
                  </Link>
                  <p className="inbox-meta">
                    {message.name} ·{" "}
                    <a href={reply} target="_blank" rel="noopener noreferrer">
                      {message.email}
                    </a>
                    {message.phone && ` · ${message.phone}`} · {relativeTime(message.created_at)}
                    {message.handled_by && ` · ditangani ${message.handled_by}`}
                  </p>
                </div>
                <div className="inbox-acts">
                  {message.status === "ditolak" && <span className="badge">Ditolak</span>}
                  {message.status === "selesai" && <span className="badge badge--ok">Selesai</span>}
                  {message.event_id && (
                    <Link href={`/admin/event/${message.event_id}`} className="chip">
                      Buka event
                    </Link>
                  )}
                  {fresh && message.kind === "event" && (
                    <form action={approveEvent}>
                      <input type="hidden" name="id" value={message.id} />
                      <button type="submit" className="btn btn--s">
                        Setujui jadi event
                      </button>
                    </form>
                  )}
                  {fresh && message.kind === "event" && <Action id={message.id} aksi="ditolak" label="Tolak" />}
                  {fresh && message.kind !== "event" && (
                    <a href={reply} className="chip" target="_blank" rel="noopener noreferrer">
                      Balas lewat email
                    </a>
                  )}
                  {fresh && message.kind !== "event" && <Action id={message.id} aksi="selesai" label="Tandai selesai" />}
                  {!fresh && <Action id={message.id} aksi="baru" label="Buka lagi" />}
                  <form action={handleMessage}>
                    <input type="hidden" name="id" value={message.id} />
                    <input type="hidden" name="aksi" value="hapus" />
                    <ConfirmButton label="Hapus" message={`Hapus kiriman "${message.subject}"?`} />
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
