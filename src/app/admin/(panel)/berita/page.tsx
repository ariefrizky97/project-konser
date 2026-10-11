import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Flash } from "@/components/admin/Flash";
import { Thumb } from "@/components/admin/Thumb";
import { PageHead, StatusBadge } from "@/components/admin/ui";
import { deletePost } from "@/lib/actions/posts";
import { requireUser } from "@/lib/auth";
import { formatDate, formatTime, param } from "@/lib/format";
import { thumb } from "@/lib/media";
import { adminListPosts } from "@/lib/queries";
import { videoThumb } from "@/lib/youtube";

export const metadata: Metadata = { title: "Berita" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminPostsPage({ searchParams }: Props) {
  await requireUser();
  const query = await searchParams;
  const keyword = param(query.q);
  const statusParam = param(query.status);
  const status =
    statusParam === "draft" || statusParam === "review" || statusParam === "published" ? statusParam : undefined;
  const posts = await adminListPosts({ keyword: keyword || undefined, status });
  const now = new Date();

  return (
    <>
      <PageHead title="Berita" action={{ href: "/admin/berita/baru", label: "Tulis artikel" }} />
      <Flash query={query} />

      <form className="filter" action="/admin/berita">
        <label className="sr" htmlFor="q">
          Cari judul
        </label>
        <input id="q" name="q" type="search" defaultValue={keyword} placeholder="Cari judul" />
        <label className="sr" htmlFor="status">
          Status
        </label>
        <select id="status" name="status" defaultValue={status ?? ""}>
          <option value="">Semua status</option>
          <option value="published">Terbit</option>
          <option value="draft">Draf</option>
          <option value="review">Menunggu tinjauan</option>
        </select>
        <button type="submit" className="chip">
          Saring
        </button>
      </form>

      {posts.length === 0 ? (
        <p className="panel-empty panel">Tidak ada artikel yang cocok.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <span className="sr">Thumbnail</span>
                </th>
                <th>Judul</th>
                <th>Kategori</th>
                <th>Status</th>
                <th>Waktu terbit</th>
                <th className="num">Dibaca</th>
                <th>
                  <span className="sr">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const scheduled = post.published_at !== null && post.published_at > now;
                const live = post.status === "published" && !scheduled;
                return (
                  <tr key={post.id}>
                    <td className="cell-thumb">
                      <span className="rowthumb">
                        <Thumb
                          src={post.cover_url ? thumb(post.cover_url, 160) : videoThumb(post.video_url)}
                          fallback={post.cover_url ?? undefined}
                          alt=""
                        />
                        {post.video_url && <span className="rowthumb-play" aria-label="Ada video" />}
                      </span>
                    </td>
                    <td className="cell-title">
                      <Link href={`/admin/berita/${post.id}`}>{post.title}</Link>
                      {post.featured && <span className="badge badge--sun">Utama</span>}
                    </td>
                    <td>{post.category_name ?? "Tanpa kategori"}</td>
                    <td>
                      <StatusBadge status={post.status} scheduled={scheduled} />
                    </td>
                    <td>
                      {post.published_at
                        ? `${formatDate(post.published_at)}, ${formatTime(post.published_at)}`
                        : "Belum diatur"}
                    </td>
                    <td className="num">{post.views.toLocaleString("id-ID")}</td>
                    <td className="cell-actions">
                      <Link href={`/admin/berita/${post.id}`} className="link">
                        Sunting
                      </Link>
                      {live && (
                        <Link href={`/berita/${post.slug}`} className="link" target="_blank">
                          Lihat
                        </Link>
                      )}
                      <form action={deletePost}>
                        <input type="hidden" name="id" value={post.id} />
                        <ConfirmButton label="Hapus" message={`Hapus artikel "${post.title}"?`} />
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
