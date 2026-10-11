import Link from "next/link";
import { Flash } from "@/components/admin/Flash";
import { LiveRefresh } from "@/components/admin/LiveRefresh";
import { PageHead, StatusBadge } from "@/components/admin/ui";
import { LoginScreen } from "@/components/admin/LoginScreen";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { formatEventRange, timeAgo } from "@/lib/format";
import { adminListPosts, getDashboardStats, getTraffic, listEvents } from "@/lib/queries";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DashboardPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  // Belum masuk: form masuk tampil langsung di /admin.
  if (!user) return <LoginScreen query={await searchParams} siteName={(await getSettings()).site_name} />;
  const [query, stats, traffic, posts, events] = await Promise.all([
    searchParams,
    getDashboardStats(),
    getTraffic(7),
    adminListPosts({}),
    listEvents({ limit: 5 }),
  ]);
  const now = new Date();

  const tiles = [
    { label: "Tayangan hari ini", value: traffic.today.views.toLocaleString("id-ID"), href: "/admin/trafik" },
    { label: "Tayangan 7 hari", value: traffic.week.views.toLocaleString("id-ID"), href: "/admin/trafik" },
    { label: "Artikel terbit", value: stats.posts_published, href: "/admin/berita?status=published" },
    { label: "Draf", value: stats.posts_draft, href: "/admin/berita?status=draft" },
    { label: "Event mendatang", value: stats.events_upcoming, href: "/admin/event" },
    { label: "Entri direktori", value: stats.directory_total, href: "/admin/direktori" },
    { label: "Iklan tayang", value: stats.ads_active, href: "/admin/iklan" },
    { label: "Total dibaca", value: stats.views_total.toLocaleString("id-ID"), href: "/admin/berita" },
  ];

  return (
    <>
      <PageHead
        title={`Halo, ${user.name}`}
        description="Ringkasan konten situs saat ini."
        action={{ href: "/admin/berita/baru", label: "Tulis artikel" }}
      />
      <Flash query={query} />
      <LiveRefresh seconds={20} />

      <div className="stats">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="stat">
            <span className="stat-value">{tile.value}</span>
            <span className="stat-label">{tile.label}</span>
          </Link>
        ))}
      </div>

      <div className="adm-cols">
        <section className="panel">
          <div className="panel-head">
            <h2>Artikel terakhir diubah</h2>
            <Link href="/admin/berita" className="link">
              Semua artikel
            </Link>
          </div>
          {posts.length === 0 ? (
            <p className="panel-empty">Belum ada artikel. Mulai dari tombol Tulis artikel.</p>
          ) : (
            <ul className="rows">
              {posts.slice(0, 6).map((post) => (
                <li key={post.id}>
                  <Link href={`/admin/berita/${post.id}`}>{post.title}</Link>
                  <span className="rows-meta">
                    <StatusBadge
                      status={post.status}
                      scheduled={post.published_at !== null && post.published_at > now}
                    />
                    {timeAgo(post.updated_at, now)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Event terdekat</h2>
            <Link href="/admin/event/baru" className="link">
              Tambah event
            </Link>
          </div>
          {events.length === 0 ? (
            <p className="panel-empty">Belum ada event mendatang.</p>
          ) : (
            <ul className="rows">
              {events.map((event) => (
                <li key={event.id}>
                  <Link href={`/admin/event/${event.id}`}>{event.title}</Link>
                  <span className="rows-meta">{formatEventRange(event.starts_at, event.ends_at, event.all_day)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
