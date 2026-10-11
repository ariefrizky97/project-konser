import type { Metadata } from "next";
import Link from "next/link";
import { EventRow } from "@/components/site/EventCard";
import { PostRow } from "@/components/site/PostCard";
import { SectionHead } from "@/components/site/SectionHead";
import { param } from "@/lib/format";
import { searchDirectory, searchEvents, searchPosts } from "@/lib/queries";
import { skeletonDelay } from "@/lib/skeleton";
import { DIRECTORY_LABELS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Cari",
  robots: { index: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SearchPage({ searchParams }: Props) {
  const keyword = param((await searchParams).q).slice(0, 80);
  const ready = keyword.length >= 2;

  const [posts, events, entries] = ready
    ? await Promise.all([
        searchPosts(keyword, 12),
        searchEvents(keyword, 8),
        searchDirectory(keyword, 8),
        skeletonDelay(),
      ])
    : [[], [], []];
  const total = posts.length + events.length + entries.length;

  return (
    <div className="wrap page page--narrow">
      <header className="page-head">
        <h1 className="page-title">Cari</h1>
        <form className="searchbox" action="/cari" role="search">
          <label className="sr" htmlFor="q">
            Kata kunci
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={keyword}
            placeholder="Nama band, acara, kota, tempat, atau #tagar"
            autoFocus={!ready}
            minLength={2}
            required
          />
          <button type="submit" className="btn">
            Cari
          </button>
        </form>
        {ready && (
          <p className="lede" role="status">
            {total > 0 ? `${total} hasil untuk “${keyword}”` : `Tidak ada hasil untuk “${keyword}”.`}
          </p>
        )}
      </header>

      {ready && total === 0 && (
        <div className="empty">
          <p>Coba kata yang lebih pendek, atau telusuri langsung.</p>
          <div className="blank-actions">
            <Link href="/berita" className="btn btn--line">Berita</Link>
            <Link href="/event" className="btn btn--line">Agenda</Link>
            <Link href="/direktori" className="btn btn--line">Direktori</Link>
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <section className="sec">
          <SectionHead title="Berita" />
          <div className="prows">
            {posts.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="sec">
          <SectionHead title="Agenda" />
          <div className="erows">
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {entries.length > 0 && (
        <section className="sec">
          <SectionHead title="Direktori" />
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
        </section>
      )}
    </div>
  );
}
