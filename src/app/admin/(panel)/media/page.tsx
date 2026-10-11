import type { Metadata } from "next";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { CopyButton } from "@/components/admin/CopyButton";
import { Flash } from "@/components/admin/Flash";
import { Thumb } from "@/components/admin/Thumb";
import { PageHead } from "@/components/admin/ui";
import { Uploader } from "@/components/admin/Uploader";
import { deleteMedia } from "@/lib/actions/media";
import { requireUser } from "@/lib/auth";
import { formatBytes } from "@/lib/format";
import { imagekitReady } from "@/lib/imagekit";
import { thumb } from "@/lib/media";
import { listMedia } from "@/lib/queries";

export const metadata: Metadata = { title: "Media" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MediaPage({ searchParams }: Props) {
  await requireUser();
  const [query, items] = await Promise.all([searchParams, listMedia()]);

  return (
    <>
      <PageHead
        title="Media"
        description="Gambar disimpan di ImageKit dan bisa dipakai sebagai sampul, gambar slide, gambar iklan, atau disisipkan ke isi artikel. Untuk video, tempel tautan YouTube di form artikel atau slide."
      />
      <Flash query={query} />

      {!imagekitReady() && (
        <p className="flash flash--note" role="status">
          ImageKit belum diatur, jadi unggah belum bisa dipakai. Isi IMAGEKIT_PRIVATE_KEY di file .env lalu
          jalankan ulang server.
        </p>
      )}

      <Uploader />

      {items.length === 0 ? (
        <p className="panel-empty panel">Belum ada gambar.</p>
      ) : (
        <ul className="mediagrid">
          {items.map((item) => (
            <li key={item.id}>
              <span className="mediagrid-img">
                <Thumb src={thumb(item.url, 400)} fallback={item.url} alt={item.filename} />
              </span>
              <p className="mediagrid-name" title={item.filename}>
                {item.filename}
              </p>
              <p className="mediagrid-meta">
                <span>{item.width && item.height ? `${item.width} × ${item.height}` : item.mime}</span>
                <span>{formatBytes(item.bytes)}</span>
              </p>
              <div className="cell-actions">
                <CopyButton text={item.url} />
                <form action={deleteMedia}>
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmButton
                    label="Hapus"
                    message={`Hapus gambar "${item.filename}" dari ImageKit? Konten yang memakainya akan kehilangan gambar.`}
                  />
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
