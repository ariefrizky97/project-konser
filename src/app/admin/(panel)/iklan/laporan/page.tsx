import type { Metadata } from "next";
import Link from "next/link";
import { LiveRefresh } from "@/components/admin/LiveRefresh";
import { TrafficChart, type ChartDay } from "@/components/admin/TrafficChart";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { formatDate, param } from "@/lib/format";
import { getAdReport } from "@/lib/queries";
import { AD_SLOT_LABELS, AD_TEMPLATE_LABELS, type AdSlotName, type AdTemplate } from "@/lib/types";

export const metadata: Metadata = { title: "Laporan iklan" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const SPANS = [7, 30, 90];
const fmtLong = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const fmtShort = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
const number = (value: number) => value.toLocaleString("id-ID");
/** Rasio klik dalam persen dengan dua desimal, atau tanda pisah bila belum ada tayangan. */
const rate = (clicks: number, views: number) =>
  views > 0 ? `${((clicks / views) * 100).toFixed(2).replace(".", ",")}%` : "–";

export default async function AdReportPage({ searchParams }: Props) {
  await requireUser();
  const requested = Number(param((await searchParams).rentang));
  const span = SPANS.includes(requested) ? requested : 30;
  const report = await getAdReport(span);

  const days: ChartDay[] = report.days.map((row) => {
    const date = new Date(`${row.day}T00:00:00Z`);
    return { day: row.day, label: fmtLong.format(date), short: fmtShort.format(date), views: row.views, visitors: row.clicks };
  });
  const top = Math.max(1, ...report.rows.map((row) => row.views));

  const tiles = [
    { label: `Tayangan ${span} hari`, value: number(report.views), note: `${number(Math.round(report.views / days.length))} per hari` },
    { label: `Klik ${span} hari`, value: number(report.clicks), note: `${number(Math.round(report.clicks / days.length))} per hari` },
    { label: "Rasio klik", value: rate(report.clicks, report.views), note: "klik dibagi tayangan" },
    { label: "Iklan tayang", value: number(report.live), note: `dari ${number(report.rows.length)} iklan` },
  ];

  return (
    <>
      <PageHead
        title="Laporan iklan"
        description="Berapa kali tiap iklan tampil dan diklik. Laporan per iklan bisa diunduh sebagai CSV untuk dikirim ke pemasang."
        action={{ href: "/admin/iklan", label: "Kelola iklan" }}
      />
      <LiveRefresh seconds={15} />

      <div className="stats">
        {tiles.map((tile) => (
          <div key={tile.label} className="stat stat--plain">
            <span className="stat-value">{tile.value}</span>
            <span className="stat-label">{tile.label}</span>
            <span className="stat-note">{tile.note}</span>
          </div>
        ))}
      </div>

      <section className="panel traffic">
        <div className="panel-head">
          <h2>Tayangan iklan per hari</h2>
          <nav className="seg" aria-label="Rentang waktu">
            {SPANS.map((option) => (
              <Link
                key={option}
                href={`/admin/iklan/laporan?rentang=${option}`}
                aria-current={option === span ? "page" : undefined}
              >
                {option} hari
              </Link>
            ))}
          </nav>
        </div>
        {report.views === 0 ? (
          <p className="panel-empty">
            Belum ada tayangan yang tercatat pada rentang ini. Tayangan mulai dihitung sejak fitur ini dipasang;
            kunjungan admin yang sedang masuk dan robot tidak dihitung.
          </p>
        ) : (
          <TrafficChart days={days} units={["tayangan", "klik"]} title="Tayangan iklan per hari" />
        )}
      </section>

      <section className="panel report">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Iklan</th>
                <th>Status</th>
                <th className="num">Tayangan</th>
                <th className="num">Klik</th>
                <th className="num">Rasio klik</th>
                <th>
                  <span className="sr">Perbandingan tayangan</span>
                </th>
                <th>
                  <span className="sr">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.id}>
                  <td className="cell-title">
                    <Link href={`/admin/iklan/${row.id}`}>{row.name}</Link>
                    <small className="cell-sub">
                      {AD_SLOT_LABELS[row.slot as AdSlotName]?.split(" (")[0]} · {AD_TEMPLATE_LABELS[row.template as AdTemplate]}
                    </small>
                  </td>
                  <td>
                    {row.live ? (
                      <span className="badge badge--ok">Tayang</span>
                    ) : (
                      <span className="badge">{row.ends_at && row.ends_at < new Date() ? `Selesai ${formatDate(row.ends_at)}` : "Tidak tayang"}</span>
                    )}
                  </td>
                  <td className="num">{number(row.views)}</td>
                  <td className="num">{number(row.clicks)}</td>
                  <td className="num">
                    <strong>{rate(row.clicks, row.views)}</strong>
                  </td>
                  <td>
                    <span className="toplist-bar report-bar" aria-hidden="true">
                      <i style={{ width: `${(row.views / top) * 100}%` }} />
                    </span>
                  </td>
                  <td className="cell-actions">
                    <a href={`/admin/iklan/laporan/unduh?id=${row.id}`} className="link">
                      Unduh laporan
                    </a>
                  </td>
                </tr>
              ))}
              {report.rows.length === 0 && (
                <tr>
                  <td colSpan={7}>Belum ada iklan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
