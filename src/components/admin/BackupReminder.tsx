import Link from "next/link";
import { IconDatabase } from "@/components/site/Icons";
import { snoozeBackup } from "@/lib/actions/backup";
import { FREQUENCIES, type BackupStatus } from "@/lib/backup";
import { formatDate, relativeTime } from "@/lib/format";

/** Pita pengingat di atas setiap halaman admin bila sudah waktunya mencadangkan. */
export function BackupReminder({ status }: { status: BackupStatus }) {
  const label = FREQUENCIES[status.frequency].label.toLowerCase();
  return (
    <aside className="bkp-remind" role="status" aria-label="Pengingat cadangan">
      <span className="bkp-remind-icon" aria-hidden="true">
        <IconDatabase />
      </span>
      <p>
        <strong>Waktunya backup database.</strong>{" "}
        {status.last
          ? `Backup terakhir ${relativeTime(status.last)} (${formatDate(status.last)}); pengingat ${label}.`
          : `Belum pernah ada backup; pengingat ${label}.`}
      </p>
      <div className="bkp-remind-actions">
        <a className="btn btn--sm" href="/admin/cadangan/unduh" download>
          Backup sekarang
        </a>
        <form action={snoozeBackup}>
          <button type="submit" className="chip">
            Ingatkan besok
          </button>
        </form>
        <Link href="/admin/cadangan" className="link">
          Atur
        </Link>
      </div>
    </aside>
  );
}
