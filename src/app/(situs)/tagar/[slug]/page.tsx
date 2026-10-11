import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/site/Pagination";
import { PostCard } from "@/components/site/PostCard";
import { pageNumber, safeDecode } from "@/lib/format";
import { countPosts, getTagBySlug, listPopularTags, listPosts } from "@/lib/queries";
import { skeletonDelay } from "@/lib/skeleton";

const PER_PAGE = 12;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const loadTag = cache((slug: string) => getTagBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = await loadTag(safeDecode((await params).slug).toLowerCase());
  if (!tag) return { title: "Tagar tidak ditemukan" };
  return { title: `#${tag.name}`, description: `Artikel dengan tagar #${tag.name}.` };
}

export default async function TagPage({ params, searchParams }: Props) {
  const slug = safeDecode((await params).slug).toLowerCase();
  const tag = await loadTag(slug);
  if (!tag) notFound();

  const page = pageNumber((await searchParams).hal);
  const [posts, total, others] = await Promise.all([
    listPosts({ tagSlug: tag.slug, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
    countPosts({ tagSlug: tag.slug }),
    listPopularTags(12),
    skeletonDelay(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const base = `/tagar/${encodeURIComponent(tag.slug)}`;

  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">#{tag.name}</h1>
        <p className="lede">
          {total} artikel dengan tagar ini.
        </p>
        <nav className="tagrow" aria-label="Tagar lain">
          {others
            .filter((item) => item.id !== tag.id)
            .map((item) => (
              <Link key={item.id} href={`/tagar/${encodeURIComponent(item.slug)}`} className="hashtag">
                #{item.name}
              </Link>
            ))}
        </nav>
      </header>

      {posts.length === 0 ? (
        <p className="empty">Belum ada artikel yang tayang dengan tagar ini.</p>
      ) : (
        <div className="grid3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} hrefFor={(target) => (target > 1 ? `${base}?hal=${target}` : base)} />
    </div>
  );
}
