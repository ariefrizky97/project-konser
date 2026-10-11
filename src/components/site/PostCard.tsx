import Link from "next/link";
import { timeAgo, toneStyle } from "@/lib/format";
import type { Post } from "@/lib/types";
import { Media } from "./Cover";

function Meta({ post }: { post: Post }) {
  return (
    <span className="card-meta">
      {post.category_name && (
        <span className="tag" style={toneStyle(post.category_color)}>
          {post.category_name}
        </span>
      )}
      {post.published_at && <time dateTime={post.published_at.toISOString()}>{timeAgo(post.published_at)}</time>}
    </span>
  );
}

/** Kartu artikel dengan sampul di atas. */
export function PostCard({ post, large = false }: { post: Post; large?: boolean }) {
  return (
    <Link href={`/berita/${post.slug}`} className={`card${large ? " card--large" : ""}`}>
      <span className="card-media" data-flash>
        <Media src={post.cover_url} video={post.video_url} seed={post.slug} />
      </span>
      <Meta post={post} />
      <span className="card-title">{post.title}</span>
      {large && post.excerpt && <span className="card-excerpt">{post.excerpt}</span>}
    </Link>
  );
}

/** Baris artikel ringkas: sampul kecil di kiri, judul di kanan. */
export function PostRow({ post }: { post: Post }) {
  return (
    <Link href={`/berita/${post.slug}`} className="prow">
      <span className="prow-media">
        <Media src={post.cover_url} video={post.video_url} seed={post.slug} width={320} />
      </span>
      <span className="prow-body">
        <span className="prow-title">{post.title}</span>
        <Meta post={post} />
      </span>
    </Link>
  );
}
