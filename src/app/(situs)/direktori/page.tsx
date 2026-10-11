import type { Metadata } from "next";
import Link from "next/link";
import { param } from "@/lib/format";
import { countDirectoryByKind, listDirectory } from "@/lib/queries";
import { skeletonDelay } from "@/lib/skeleton";
import { DIRECTORY_KINDS, DIRECTORY_LABELS, type DirectoryKind } from "@/lib/types";

export const metadata: Metadata = {
  title: "Direktori",
  description: "Daftar venue, artis, organizer, komunitas, dan vendor acara.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DirectoryPage({ searchParams }: Props) {
  const requested = param((await searchParams).jenis);
  const kind = (DIRECTORY_KINDS as readonly string[]).includes(requested)
    ? (requested as DirectoryKind)
    : undefined;

  const [entries, counts] = await Promise.all([listDirectory({ kind }), countDirectoryByKind(), skeletonDelay()]);
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">Direktori</h1>
        <p className="lede">Tempat, pengisi acara, penyelenggara, komunitas, dan rekanan produksi.</p>
        <nav className="chips" aria-label="Jenis">
          <Link href="/direktori" className="chip" aria-current={!kind ? "page" : undefined}>
            Semua <span className="chip-count">{total}</span>
          </Link>
          {DIRECTORY_KINDS.map((item) => (
            <Link
              key={item}
              href={`/direktori?jenis=${item}`}
              className="chip"
              aria-current={item === kind ? "page" : undefined}
            >
              {DIRECTORY_LABELS[item]} <span className="chip-count">{counts[item] ?? 0}</span>
            </Link>
          ))}
        </nav>
      </header>

      {entries.length === 0 ? (
        <p className="empty">Belum ada entri untuk jenis ini.</p>
      ) : (
        <div className="dir">
          {entries.map((entry) => (
            <Link key={entry.id} href={`/direktori/${entry.slug}`} className="dir-item">
              <span className="dir-kind">{DIRECTORY_LABELS[entry.kind]}</span>
              <span className="dir-name">{entry.name}</span>
              {entry.city && <span className="dir-city">{entry.city}</span>}
              <span className="dir-sum">{entry.summary}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
