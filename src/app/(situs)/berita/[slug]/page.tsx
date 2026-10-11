import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/site/AdSlot";
import { ArticleView } from "@/components/site/ArticleView";
import { PostCard } from "@/components/site/PostCard";
import { SectionHead } from "@/components/site/SectionHead";
import { getPostBySlug, getPostTags, incrementPostViews, listRelatedPosts } from "@/lib/queries";
import { siteUrl } from "@/lib/settings";
import { skeletonDelay } from "@/lib/skeleton";
import { videoThumb } from "@/lib/youtube";

type Props = { params: Promise<{ slug: string }> };

// Dipakai oleh generateMetadata dan halaman; cache membuat query hanya jalan sekali.
const loadPost = cache((slug: string) => getPostBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await loadPost((await params).slug);
  if (!post) return { title: "Artikel tidak ditemukan" };
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    alternates: { canonical: `/berita/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      publishedTime: post.published_at?.toISOString(),
      images: post.cover_url ? [post.cover_url] : videoThumb(post.video_url) ? [videoThumb(post.video_url)] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const post = await loadPost((await params).slug);
  if (!post) notFound();

  const [related, tags] = await Promise.all([
    listRelatedPosts(post, 3),
    getPostTags(post.id),
    incrementPostViews(post.id),
    skeletonDelay(),
  ]);
  const url = `${siteUrl()}/berita/${post.slug}`;

  return (
    <>
      <ArticleView post={post} tags={tags} url={url} />

      <div className="wrap">
        <AdSlot slot="inline" />
      </div>

      {related.length > 0 && (
        <section className="wrap sec">
          <SectionHead title="Berita terkait" href="/berita" linkLabel="Semua berita" />
          <div className="grid3">
            {related.map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
