import type { Metadata } from "next";
import Link from "next/link";
import { LiveRefresh } from "@/components/admin/LiveRefresh";
import { TrafficChart, type ChartDay } from "@/components/admin/TrafficChart";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { param } from "@/lib/format";
import { getTraffic, listPopularPosts } from "@/lib/queries";

export const metadata: Metadata = { title: "Trafik" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const SPANS = [7, 30, 90];
const fmtLong = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const fmtShort = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
const number = (value: number) => value.toLocaleString("id-ID");

export default async function TrafficPage({ searchParams }: Props) {
  await requireUser();
  const requested = Number(param((await searchParams).rentang));
  const span = SPANS.includes(requested) ? requested : 30;
  const [traffic, popular] = await Promise.all([getTraffic(span), listPopularPosts(8)]);

  const days: ChartDay[] = traffic.days.map((row) => {
    const date = new Date(`${row.day}T00:00:00Z`);
    return { ...row, label: fmtLong.format(date), short: fmtShort.format(date) };
  });
  const empty = traffic.month.views === 0;
  const busiest = days.reduce((best, day) => (day.views > best.views ? day : best), days[0]);

  const tiles = [
    { label: "Tayangan hari ini", value: traffic.today.views, note: `${number(traffic.today.visitors)} pengunjung` },
    { label: "Tayangan 7 hari", value: traffic.week.views, note: `${number(traffic.week.visitors)} kunjungan harian` },
    {
      label: `Tayangan ${span} hari`,
      value: traffic.month.views,
      note: `${number(traffic.month.visitors)} kunjungan harian`,
    },
    {
      label: "Rata-rata per hari",
      value: Math.round(traffic.month.views / days.length),
      note: empty ? "Belum ada data" : `Teramai ${busiest.short}: ${number(busiest.views)}`,
    },
  ];

  return (
    <>
      <PageHead
        title="Trafik pengunjung"
        description="Berapa kali halaman situs dibuka dan oleh berapa pengunjung, diperbarui otomatis. Robot tidak dihitung; di situs yang sudah tayang, kunjungan admin yang sedang masuk juga tidak dihitung."
      />
      <div className="export-bar">
        <span className="export-label">Ekspor CSV</span>
        <a className="chip" href={`/admin/trafik/unduh?isi=harian&rentang=${span}`} download>
          Per hari ({span} hari)
        </a>
        <a className="chip" href={`/admin/trafik/unduh?isi=halaman&rentang=${span}`} download>
          Halaman teramai ({span} hari)
        </a>
        <a className="chip" href="/admin/trafik/unduh?isi=artikel" download>
          Artikel paling banyak dibaca
        </a>
      </div>
      <LiveRefresh seconds={10} />

      <div className="stats">
        {tiles.map((tile) => (
          <div key={tile.label} className="stat stat--plain">
            <span className="stat-value">{number(tile.value)}</span>
            <span className="stat-label">{tile.label}</span>
            <span className="stat-note">{tile.note}</span>
          </div>
        ))}
      </div>

      <section className="panel traffic">
        <div className="panel-head">
          <h2>Tayangan halaman per hari</h2>
          <nav className="seg" aria-label="Rentang waktu">
            {SPANS.map((option) => (
              <Link
                key={option}
                href={`/admin/trafik?rentang=${option}`}
                aria-current={option === span ? "page" : undefined}
              >
                {option} hari
              </Link>
            ))}
          </nav>
        </div>
        {empty ? (
          <p className="panel-empty">
            Belum ada kunjungan yang tercatat. Buka halaman situs di tab lain, lalu angka di sini terisi sendiri dalam
            beberapa detik.
          </p>
        ) : (
          <>
            <TrafficChart days={days} />
            <details className="traffic-table">
              <summary>Lihat sebagai tabel</summary>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th className="num">Tayangan</th>
                      <th className="num">Pengunjung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...days].reverse().map((day) => (
                      <tr key={day.day}>
                        <td>{day.label}</td>
                        <td className="num">{number(day.views)}</td>
                        <td className="num">{number(day.visitors)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </section>

      <div className="adm-cols">
        <section className="panel">
          <div className="panel-head">
            <h2>Halaman teramai, {span} hari</h2>
          </div>
          {traffic.pages.length === 0 ? (
            <p className="panel-empty">Belum ada data.</p>
          ) : (
            <ol className="toplist">
              {traffic.pages.map((page) => (
                <li key={page.path}>
                  <span className="toplist-main">
                    <a href={page.path} target="_blank" rel="noreferrer">
                      {page.title ?? (page.path === "/" ? "Beranda" : page.path)}
                    </a>
                    {page.title && <small>{page.path}</small>}
                  </span>
                  <span className="toplist-bar" aria-hidden="true">
                    <i style={{ width: `${(page.views / traffic.pages[0].views) * 100}%` }} />
                  </span>
                  <span className="toplist-num">{number(page.views)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Artikel paling banyak dibaca</h2>
            <Link href="/admin/berita" className="link">
              Semua artikel
            </Link>
          </div>
          {popular.length === 0 ? (
            <p className="panel-empty">Belum ada artikel terbit.</p>
          ) : (
            <ol className="toplist">
              {popular.map((post) => (
                <li key={post.id}>
                  <span className="toplist-main">
                    <Link href={`/admin/berita/${post.id}`}>{post.title}</Link>
                    {post.category_name && <small>{post.category_name}</small>}
                  </span>
                  <span className="toplist-bar" aria-hidden="true">
                    <i style={{ width: `${(post.views / Math.max(1, popular[0].views)) * 100}%` }} />
                  </span>
                  <span className="toplist-num">{number(post.views)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
