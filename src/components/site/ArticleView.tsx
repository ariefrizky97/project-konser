import Link from "next/link";
import { formatDateTime, readingMinutes, relativeTime, toneStyle } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import type { Post, Tag } from "@/lib/types";
import { youtubeId } from "@/lib/youtube";
import { HeroMotion } from "./ArticleHero";
import { Avatar } from "./Avatar";
import { Media } from "./Cover";
import { ShareButtons } from "./ShareButtons";
import { YouTubeEmbed } from "./YouTubeEmbed";

/**
 * Tampilan satu artikel: pembuka bergambar penuh dengan judul di atasnya, lalu isi.
 * Dipakai oleh halaman artikel dan oleh pratinjau draf, jadi keduanya selalu sama.
 */
export function ArticleView({ post, tags, url }: { post: Post; tags: Tag[]; url: string }) {
  const videoId = post.video_url ? youtubeId(post.video_url) : null;
  const when = post.published_at ?? post.updated_at;

  return (
    <article className="wrap article">
      <div className="ahero">
        <div className="ahero-media">
          <Media src={post.cover_url} video={post.video_url} seed={post.slug} alt="" width={1600} />
        </div>
        <nav className="ahero-crumbs" aria-label="Posisi halaman">
          <Link href="/">Beranda</Link>
          <span aria-hidden="true">/</span>
          <Link href="/berita">Berita</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{post.title}</span>
        </nav>
        <header className="ahero-text">
          <p className="ahero-tags">
            {post.category_name && post.category_slug && (
              <Link href={`/berita?kategori=${post.category_slug}`} className="pill" style={toneStyle(post.category_color)}>
                {post.category_name}
              </Link>
            )}
            {tags.slice(0, 2).map((tag) => (
              <Link key={tag.id} href={`/tagar/${encodeURIComponent(tag.slug)}`} className="pill pill--glass">
                #{tag.name}
              </Link>
            ))}
          </p>
          <h1 className="article-title">{post.title}</h1>
          <p className="byline">
            {post.author_name && (
              <span className="byline-author">
                <Avatar name={post.author_name} src={post.author_avatar} crop={post.author_avatar_crop} className="byline-avatar" />
                {post.author_name}
              </span>
            )}
            <time dateTime={when.toISOString()} className="byline-time">
              {post.published_at ? "Terbit" : "Diubah"} {relativeTime(when)}, {formatDateTime(when)}
            </time>
            <span>{readingMinutes(post.body)} menit baca</span>
          </p>
        </header>
        <HeroMotion target="isi-artikel" />
      </div>

      <div className="article-body" id="isi-artikel">
        {post.excerpt && <p className="article-lede">{post.excerpt}</p>}
        {videoId && (
          <div className="article-media">
            <YouTubeEmbed id={videoId} title={post.title} />
          </div>
        )}
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
        {tags.length > 0 && (
          <nav className="tagrow tagrow--article" aria-label="Tagar">
            {tags.map((tag) => (
              <Link key={tag.id} href={`/tagar/${encodeURIComponent(tag.slug)}`} className="hashtag">
                #{tag.name}
              </Link>
            ))}
          </nav>
        )}
        <ShareButtons url={url} title={post.title} />
      </div>
    </article>
  );
}
