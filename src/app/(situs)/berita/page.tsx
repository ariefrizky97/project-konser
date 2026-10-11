import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/site/Pagination";
import { PostCard } from "@/components/site/PostCard";
import { pageNumber, param } from "@/lib/format";
import { countPosts, getCategoryBySlug, listCategories, listPopularTags, listPosts } from "@/lib/queries";
import { skeletonDelay } from "@/lib/skeleton";

const PER_PAGE = 12;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const slug = param((await searchParams).kategori);
  const category = slug ? await getCategoryBySlug(slug) : null;
  return {
    title: category ? `Berita ${category.name}` : "Berita",
    description: category
      ? `Kabar terbaru di kategori ${category.name}.`
      : "Kabar terbaru musik, film, liputan acara, dan siaran pers.",
  };
}

export default async function NewsPage({ searchParams }: Props) {
  const query = await searchParams;
  const slug = param(query.kategori);
  const page = pageNumber(query.hal);

  const [categories, category] = await Promise.all([
    listCategories(),
    slug ? getCategoryBySlug(slug) : Promise.resolve(null),
  ]);
  if (slug && !category) notFound();

  const [posts, total, popularTags] = await Promise.all([
    listPosts({ categorySlug: slug || undefined, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
    countPosts({ categorySlug: slug || undefined }),
    listPopularTags(10),
    skeletonDelay(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    if (slug) search.set("kategori", slug);
    if (target > 1) search.set("hal", String(target));
    const text = search.toString();
    return text ? `/berita?${text}` : "/berita";
  };

  // Di halaman pertama, artikel teratas tampil besar.
  const [first, ...others] = posts;
  const showLarge = page === 1 && Boolean(first);

  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="page-title">{category ? category.name : "Berita"}</h1>
        <nav className="chips" aria-label="Kategori">
          <Link href="/berita" className="chip" aria-current={!slug ? "page" : undefined}>
            Semua
          </Link>
          {categories.map((item) => (
            <Link
              key={item.id}
              href={`/berita?kategori=${item.slug}`}
              className="chip"
              aria-current={item.slug === slug ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        {popularTags.length > 0 && (
          <nav className="tagrow" aria-label="Tagar populer">
            {popularTags.map((tag) => (
              <Link key={tag.id} href={`/tagar/${encodeURIComponent(tag.slug)}`} className="hashtag">
                #{tag.name}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {posts.length === 0 ? (
        <p className="empty">Belum ada artikel di sini.</p>
      ) : (
        <>
          {showLarge && (
            <div className="feature">
              <PostCard post={first} large />
            </div>
          )}
          <div className="grid3">
            {(showLarge ? others : posts).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      )}

      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </div>
  );
}
