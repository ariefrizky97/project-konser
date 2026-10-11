import Link from "next/link";
import { getActiveAd } from "@/lib/queries";
import type { AdSlotName } from "@/lib/types";
import { AdView } from "./AdView";

/**
 * Slot iklan. Menampilkan iklan aktif untuk slot ini; klik dicatat lewat /go/<id>.
 * Bila tidak ada iklan aktif, slot header menampilkan ajakan pasang iklan
 * dan slot sela konten tidak menampilkan apa pun.
 */
export async function AdSlot({ slot }: { slot: AdSlotName }) {
  const ad = await getActiveAd(slot);

  if (!ad) {
    if (slot !== "header") return null;
    return (
      <div className="adslot adslot--header">
        <Link href="/kontak?perihal=iklan" className="ad ad--house">
          <span className="ad-body">
            <span className="ad-head">Ruang iklan tersedia</span>
            <span className="ad-sub">Tampil paling atas di semua halaman, ukuran 970 × 220.</span>
          </span>
          <span className="ad-cta">Pasang iklan</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={`adslot adslot--${slot}`} data-ad={ad.id}>
      <AdView
        ad={ad}
        href={ad.target_url ? `/go/${ad.id}` : ""}
        external={/^https?:/i.test(ad.target_url)}
      />
    </div>
  );
}
