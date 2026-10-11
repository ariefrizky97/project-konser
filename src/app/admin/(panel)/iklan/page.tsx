import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Flash } from "@/components/admin/Flash";
import { PageHead } from "@/components/admin/ui";
import { AdView } from "@/components/site/AdView";
import { deleteAd, toggleAd } from "@/lib/actions/ads";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { adminListAds } from "@/lib/queries";
import { AD_SLOT_LABELS, AD_TEMPLATE_LABELS, type Ad } from "@/lib/types";

export const metadata: Metadata = { title: "Iklan" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function schedule(ad: Ad): string {
  if (ad.starts_at && ad.ends_at) return `${formatDate(ad.starts_at)} sampai ${formatDate(ad.ends_at)}`;
  if (ad.starts_at) return `Mulai ${formatDate(ad.starts_at)}`;
  if (ad.ends_at) return `Sampai ${formatDate(ad.ends_at)}`;
  return "Tanpa batas waktu";
}

function state(ad: Ad, now: Date): { label: string; className: string } {
  if (!ad.active) return { label: "Mati", className: "badge" };
  if (ad.starts_at && ad.starts_at > now) return { label: "Menunggu jadwal", className: "badge badge--note" };
  if (ad.ends_at && ad.ends_at < now) return { label: "Jadwal habis", className: "badge" };
  return { label: "Tayang", className: "badge badge--ok" };
}

export default async function AdminAdsPage({ searchParams }: Props) {
  await requireUser();
  const [query, ads] = await Promise.all([searchParams, adminListAds()]);
  const now = new Date();

  return (
    <>
      <PageHead
        title="Iklan"
        description="Iklan tampil di slot header pada semua halaman dan di sela konten. Bila satu slot punya beberapa iklan aktif, iklan bergiliran setiap halaman dimuat."
        action={{ href: "/admin/iklan/baru", label: "Buat iklan" }}
      />
      <Flash query={query} />
      <p className="adm-sublink">
        <Link href="/admin/iklan/laporan" className="link">
          Lihat laporan tayangan dan klik
        </Link>
      </p>

      {ads.length === 0 ? (
        <p className="panel-empty panel">
          Belum ada iklan. Slot header sementara menampilkan ajakan pasang iklan.
        </p>
      ) : (
        <ul className="adlist">
          {ads.map((ad) => {
            const current = state(ad, now);
            return (
              <li key={ad.id} className="panel">
                <div className="adlist-head">
                  <div>
                    <h2>
                      <Link href={`/admin/iklan/${ad.id}`}>{ad.name}</Link>
                    </h2>
                    <p className="adlist-meta">
                      {AD_SLOT_LABELS[ad.slot]}, template {AD_TEMPLATE_LABELS[ad.template].toLowerCase()}. {schedule(ad)}.
                    </p>
                  </div>
                  <div className="adlist-stats">
                    <span className={current.className}>{current.label}</span>
                    <span>{ad.clicks.toLocaleString("id-ID")} klik</span>
                  </div>
                </div>
                <div className={`adpreview-stage adpreview-stage--${ad.slot}`}>
                  <div className={`adslot adslot--${ad.slot}`}>
                    <AdView ad={ad} href="" />
                  </div>
                </div>
                <div className="cell-actions">
                  <Link href={`/admin/iklan/${ad.id}`} className="link">
                    Sunting
                  </Link>
                  <form action={toggleAd}>
                    <input type="hidden" name="id" value={ad.id} />
                    <button type="submit" className="link">
                      {ad.active ? "Matikan" : "Nyalakan"}
                    </button>
                  </form>
                  <form action={deleteAd}>
                    <input type="hidden" name="id" value={ad.id} />
                    <ConfirmButton label="Hapus" message={`Hapus iklan "${ad.name}"?`} />
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
