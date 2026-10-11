import Link from "next/link";
import { formatDate, timeAgo, toneStyle } from "@/lib/format";
import type { Category, Post } from "@/lib/types";
import type { YtList } from "@/lib/ytlist";
import { Avatar } from "./Avatar";
import { CatPager } from "./CatPager";
import { Media } from "./Cover";
import { YtPlaylist } from "./YtPlaylist";

const PER_PAGE = 7;
const MAX_PAGES = 3;

function Ago({ date }: { date: Date | null }) {
  if (!date) return null;
  return (
    <time className="cat-time" dateTime={date.toISOString()}>
      <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
        <circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.6V8l2.3 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {timeAgo(date)}
    </time>
  );
}

/**
 * Blok satu kategori di beranda: artikel utama dengan tombol "Baca selengkapnya", enam artikel
 * kecil, tombol Sebelumnya/Berikutnya, lalu pemutar dan daftar video YouTube kategori itu.
 */
export function CategoryBlock({ category, posts, videos }: { category: Category; posts: Post[]; videos: YtList | null }) {
  const pages: Post[][] = [];
  for (let start = 0; start < posts.length && pages.length < MAX_PAGES; start += PER_PAGE) {
    pages.push(posts.slice(start, start + PER_PAGE));
  }
  const all = `/berita?kategori=${category.slug}`;
  const headId = `kat-${category.slug}`;

  return (
    <div className="catwrap" style={toneStyle(category.color)}>
      {pages.length > 0 && (
        <section className="catblock" aria-labelledby={headId}>
          <div className="catblock-head">
            <h2 className="cat-flag" id={headId}>
              {category.name}
            </h2>
            <Link href={all} className="catblock-all">
              Semua {category.name} <span aria-hidden="true">→</span>
            </Link>
          </div>

          {pages.map((page, index) => {
            const [lead, ...rest] = page;
            return (
              <div className="catpage" data-page={index} hidden={index > 0} key={lead.id}>
                <article className="catlead">
                  <Link href={`/berita/${lead.slug}`} className="catlead-media" tabIndex={-1} aria-hidden="true">
                    <Media src={lead.cover_url} video={lead.video_url} seed={lead.slug} width={900} />
                    <span className="catlead-tag">{category.name}</span>
                  </Link>
                  <div className="catlead-body">
                    <p className="catlead-meta">
                      {lead.author_name && (
                        <span className="cat-author">
                          <Avatar name={lead.author_name} src={lead.author_avatar} crop={lead.author_avatar_crop} className="cat-avatar" />
                          {lead.author_name}
                        </span>
                      )}
                      <Ago date={lead.published_at} />
                    </p>
                    <h3 className="catlead-title">
                      <Link href={`/berita/${lead.slug}`}>{lead.title}</Link>
                    </h3>
                    {lead.excerpt && <p className="catlead-excerpt">{lead.excerpt}</p>}
                    <Link href={`/berita/${lead.slug}`} className="catlead-more" aria-label={`Baca selengkapnya: ${lead.title}`}>
                      Baca selengkapnya <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>

                {rest.length > 0 && (
                  <ul className="catgrid">
                    {rest.map((post) => (
                      <li key={post.id}>
                        <Link href={`/berita/${post.slug}`} className="catitem">
                          <span className="catitem-media">
                            <Media src={post.cover_url} video={post.video_url} seed={post.slug} width={360} />
                          </span>
                          <span className="catitem-body">
                            <Ago date={post.published_at} />
                            <span className="catitem-title">{post.title}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          <div className="catblock-foot">
            {pages.length > 1 ? <CatPager pages={pages.length} label={category.name} /> : <span />}
            <Link href={all} className="catblock-more">
              Baca selengkapnya di {category.name} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      )}

      {videos && (
        <YtPlaylist
          title={videos.title}
          url={videos.url}
          playlist={videos.playlist}
          videos={videos.videos.map((video) => ({
            id: video.id,
            title: video.title,
            duration: video.duration,
            channel: video.channel ?? "",
            date: video.published ? formatDate(new Date(video.published)) : "",
          }))}
        />
      )}
    </div>
  );
}
