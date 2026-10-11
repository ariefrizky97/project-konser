import Link from "next/link";
import { timeAgo, toneStyle } from "@/lib/format";
import type { Post } from "@/lib/types";
import { Media } from "./Cover";

/** Ubin artikel untuk mozaik beranda: gambar penuh dengan judul di atasnya. */
export function Tile({ post, large = false, index = 0 }: { post: Post; large?: boolean; index?: number }) {
  return (
    <Link
      href={`/berita/${post.slug}`}
      className={`tile${large ? " tile--large" : ""}`}
      style={{ "--i": index } as React.CSSProperties}
    >
      <span className="tile-media">
        <Media src={post.cover_url} video={post.video_url} seed={post.slug} width={large ? 1400 : 700} />
      </span>
      {post.category_name && (
        <span className="pill" style={toneStyle(post.category_color)}>
          {post.category_name}
        </span>
      )}
      <span className="tile-text">
        {post.published_at && (
          <time className="tile-time" dateTime={post.published_at.toISOString()}>
            {timeAgo(post.published_at)}
          </time>
        )}
        <span className="tile-title">{post.title}</span>
        {large && post.excerpt && <span className="tile-excerpt">{post.excerpt}</span>}
      </span>
    </Link>
  );
}
