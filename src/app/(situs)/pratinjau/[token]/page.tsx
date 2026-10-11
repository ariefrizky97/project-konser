import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/site/ArticleView";
import { getPostByPreviewToken, getPostTags } from "@/lib/queries";
import { siteUrl } from "@/lib/settings";

// Pratinjau draf: artikel tampil persis seperti di halaman publik, apa pun statusnya,
// bagi siapa saja yang memegang tautannya. Halaman ini tidak boleh diindeks mesin pencari.
export const metadata: Metadata = { title: "Pratinjau artikel", robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }> };

export default async function PreviewPage({ params }: Props) {
  const post = await getPostByPreviewToken((await params).token);
  if (!post) notFound();
  const tags = await getPostTags(post.id);
  const live = post.status === "published" && post.published_at !== null && post.published_at <= new Date();

  return (
    <>
      <p className="wrap preview-note" role="status">
        <strong>Pratinjau.</strong>{" "}
        {live
          ? "Artikel ini sudah terbit."
          : "Artikel ini belum terbit dan hanya bisa dilihat lewat tautan ini. Jangan sebarkan tautannya."}
      </p>
      <ArticleView post={post} tags={tags} url={`${siteUrl()}/berita/${post.slug}`} />
    </>
  );
}
