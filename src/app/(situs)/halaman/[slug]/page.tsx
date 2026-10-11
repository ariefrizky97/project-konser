import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/format";
import { makeExcerpt, renderMarkdown } from "@/lib/markdown";
import { getPageBySlug } from "@/lib/queries";

type Props = { params: Promise<{ slug: string }> };

const loadPage = cache((slug: string) => getPageBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await loadPage((await params).slug);
  if (!page) return { title: "Halaman tidak ditemukan" };
  return { title: page.title, description: makeExcerpt(page.body, 160), alternates: { canonical: `/halaman/${page.slug}` } };
}

/** Halaman statis yang ditulis dari Admin > Halaman. */
export default async function StaticPage({ params }: Props) {
  const page = await loadPage((await params).slug);
  if (!page) notFound();

  return (
    <article className="wrap page page--narrow">
      <header className="page-head">
        <h1 className="page-title">{page.title}</h1>
        <p className="page-updated">Terakhir diperbarui {formatDate(page.updated_at)}</p>
      </header>
      <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }} />
    </article>
  );
}
