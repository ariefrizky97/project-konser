import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Flash } from "@/components/admin/Flash";
import { PageHead } from "@/components/admin/ui";
import { deleteSlide, toggleSlide } from "@/lib/actions/slides";
import { requireUser } from "@/lib/auth";
import { sized } from "@/lib/media";
import { adminListSlides } from "@/lib/queries";
import { SLIDE_KIND_LABELS } from "@/lib/types";
import { youtubeId, youtubeThumb } from "@/lib/youtube";

export const metadata: Metadata = { title: "Slide" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminSlidesPage({ searchParams }: Props) {
  await requireUser();
  const [query, slides] = await Promise.all([searchParams, adminListSlides()]);

  return (
    <>
      <PageHead
        title="Slide"
        description="Slide tampil bergantian di bagian paling atas beranda. Isinya bisa foto atau video YouTube. Paling banyak delapan slide aktif yang ditampilkan."
        action={{ href: "/admin/slide/baru", label: "Tambah slide" }}
      />
      <Flash query={query} />

      {slides.length === 0 ? (
        <p className="panel-empty panel">
          Belum ada slide. Selama kosong, beranda menampilkan artikel utama di tempat slide.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <span className="sr">Pratinjau</span>
                </th>
                <th>Judul</th>
                <th>Jenis</th>
                <th className="num">Urutan</th>
                <th>Status</th>
                <th>
                  <span className="sr">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {slides.map((slide) => {
                const videoId = slide.kind === "video" ? youtubeId(slide.video_url) : null;
                const thumb = videoId ? youtubeThumb(videoId) : slide.image_url ? sized(slide.image_url, 240) : "";
                return (
                  <tr key={slide.id} className={slide.active ? undefined : "row-past"}>
                    <td className="cell-thumb">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" loading="lazy" />
                      ) : (
                        <span className="cell-thumb-empty">Sampul bawaan</span>
                      )}
                    </td>
                    <td className="cell-title">
                      <Link href={`/admin/slide/${slide.id}`}>{slide.title}</Link>
                    </td>
                    <td>{SLIDE_KIND_LABELS[slide.kind]}</td>
                    <td className="num">{slide.sort}</td>
                    <td>
                      <span className={slide.active ? "badge badge--ok" : "badge"}>
                        {slide.active ? "Tampil" : "Disembunyikan"}
                      </span>
                    </td>
                    <td className="cell-actions">
                      <Link href={`/admin/slide/${slide.id}`} className="link">
                        Sunting
                      </Link>
                      <form action={toggleSlide}>
                        <input type="hidden" name="id" value={slide.id} />
                        <button type="submit" className="link">
                          {slide.active ? "Sembunyikan" : "Tampilkan"}
                        </button>
                      </form>
                      <form action={deleteSlide}>
                        <input type="hidden" name="id" value={slide.id} />
                        <ConfirmButton label="Hapus" message={`Hapus slide "${slide.title}"?`} />
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
