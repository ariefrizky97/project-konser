import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { formatDate, formatTime, relativeTime } from "@/lib/format";
import { listActivity } from "@/lib/queries";

export const metadata: Metadata = { title: "Riwayat" };

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase() || "?";
}

export default async function ActivityPage() {
  await requireUser();
  const items = await listActivity(200);

  return (
    <>
      <PageHead
        title="Riwayat"
        description="Siapa melakukan apa di admin, 200 kejadian terakhir. Riwayat versi tiap artikel ada di halaman sunting artikelnya."
      />
      {items.length === 0 ? (
        <p className="panel-empty panel">Belum ada kejadian yang tercatat.</p>
      ) : (
        <ol className="panel activity">
          {items.map((item) => (
            <li key={item.id}>
              <span className="activity-avatar" aria-hidden="true">
                {initials(item.user_name)}
              </span>
              <span className="activity-text">
                <strong>{item.user_name}</strong>{" "}
                {item.action.charAt(0).toLowerCase() + item.action.slice(1)}
              </span>
              <time dateTime={item.created_at.toISOString()} title={`${formatDate(item.created_at)}, ${formatTime(item.created_at)} WIB`}>
                {relativeTime(item.created_at)}
              </time>
              {item.href ? (
                <Link href={item.href} className="link">
                  Buka
                </Link>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
