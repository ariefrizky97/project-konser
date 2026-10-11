import type { Metadata } from "next";
import { Flash } from "@/components/admin/Flash";
import { RestoreForm } from "@/components/admin/RestoreForm";
import { PageHead } from "@/components/admin/ui";
import { IconDownload } from "@/components/site/Icons";
import { saveBackupReminder } from "@/lib/actions/backup";
import { requireAdmin } from "@/lib/auth";
import { CONFIRM_PHRASE, FREQUENCIES, TABLE_LABELS, currentColumns, getBackupStatus, listBackupLogs, orderedTables, type Frequency } from "@/lib/backup";
import { one } from "@/lib/db";
import { formatBytes, formatDateTime, param, relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Backup & Restore" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function BackupPage({ searchParams }: Props) {
  await requireAdmin();
  const [query, status, logs, columns] = await Promise.all([searchParams, getBackupStatus(), listBackupLogs(), currentColumns()]);
  const tables = orderedTables(Object.keys(columns));
  const countRow = await one<Record<string, number>>(
    `SELECT ${tables.map((name, index) => `(SELECT count(*) FROM "${name}")::int AS c${index}`).join(", ") || "0 AS c0"}`,
  );
  const counts = tables.map((name, index) => ({ name, label: TABLE_LABELS[name] ?? name, rows: countRow?.[`c${index}`] ?? 0 }));
  const totals = { rows: counts.reduce((sum, item) => sum + item.rows, 0) };
  const detail = param(query.rinci);

  return (
    <>
      <PageHead
        title="Backup & Restore"
        description="Backup mengunduh salinan seluruh isi situs (artikel, event, direktori, iklan, pengguna, pengaturan, dan lainnya) sebagai satu berkas. Restore mengembalikan isi situs dari berkas itu."
      />
      <Flash query={query} />

      <div className="bkp-grid">
        <section className="panel bkp-card bkp-now" aria-labelledby="bkp-now">
          <div className="panel-head">
            <h2 id="bkp-now">
              <span className="bkp-step" aria-hidden="true">
                <IconDownload />
              </span>
              Backup
            </h2>
            <span className={status.overdue ? "badge badge--warn" : "badge badge--ok"}>
              {status.frequency === "mati" ? "Pengingat mati" : status.overdue ? "Waktunya backup" : "Aman"}
            </span>
          </div>
          <dl className="bkp-facts">
            <div>
              <dt>Backup terakhir</dt>
              <dd>{status.last ? `${relativeTime(status.last)}, ${formatDateTime(status.last)}` : "Belum pernah"}</dd>
            </div>
            <div>
              <dt>Pengingat</dt>
              <dd>
                {FREQUENCIES[status.frequency].label}
                {status.due && <span className="bkp-due">{status.overdue ? " · lewat jatuh tempo" : ` · berikutnya ${formatDateTime(status.due)}`}</span>}
              </dd>
            </div>
            <div>
              <dt>Isi saat ini</dt>
              <dd>
                {tables.length} tabel, {(totals?.rows ?? 0).toLocaleString("id-ID")} baris
              </dd>
            </div>
          </dl>
          <a className="btn bkp-download" href="/admin/cadangan/unduh" download>
            <IconDownload />
            Backup sekarang (unduh .json)
          </a>
          <p className="field-hint">
            Berkas berisi data pengguna termasuk email dan sandi yang sudah di-hash. Simpan di tempat aman (misalnya Google Drive
            pribadi), jangan dibagikan. Gambar tetap tersimpan di ImageKit dan tidak ikut di berkas ini.
          </p>
        </section>

        <section className="panel bkp-card bkp-danger" id="pulihkan" aria-labelledby="bkp-restore">
          <div className="panel-head">
            <h2 id="bkp-restore">
              <span className="bkp-step bkp-step--up" aria-hidden="true">
                <IconDownload />
              </span>
              Restore
            </h2>
            <span className="badge badge--warn">Mengganti seluruh isi</span>
          </div>
          <p className="adm-desc">
            Isi situs saat ini diganti dengan isi berkas backup. Berkas diperiksa dulu: harus backup Project Konser yang utuh (sidik
            SHA-256 cocok), tabel dan kolomnya dikenal, dan berisi paling sedikit satu admin. Bila gagal di tengah jalan, semuanya
            dibatalkan. Anda tetap masuk setelah selesai.
          </p>
          {detail && <p className="field-error">Bagian yang bermasalah: {detail}</p>}
          <RestoreForm phrase={CONFIRM_PHRASE} />
        </section>
      </div>

      <section className="panel bkp-layout" aria-labelledby="bkp-layout">
        <div className="panel-head">
          <h2 id="bkp-layout">Susunan berkas backup</h2>
          <a className="chip" href="/admin/cadangan/template" download>
            Unduh template (.json)
          </a>
        </div>
        <ol className="bkp-parts">
          <li>
            <strong>Info berkas</strong>
            <span>format, versi, nama situs, waktu dibuat, dibuat oleh, dan sidik SHA-256</span>
          </li>
          <li>
            <strong>Ringkasan</strong>
            <span>jumlah baris tiap tabel (counts)</span>
          </li>
          <li>
            <strong>Kolom</strong>
            <span>daftar kolom tiap tabel (columns)</span>
          </li>
          <li>
            <strong>Isi tabel</strong>
            <span>satu baris data per baris teks, urut seperti daftar di bawah (tables)</span>
          </li>
        </ol>
        <div className="table-wrap">
          <table className="table bkp-contents">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Isi</th>
                <th scope="col">Tabel</th>
                <th scope="col" className="num">
                  Baris saat ini
                </th>
              </tr>
            </thead>
            <tbody>
              {counts.map((item, index) => (
                <tr key={item.name}>
                  <td>{index + 1}</td>
                  <td>{item.label}</td>
                  <td>
                    <code>{item.name}</code>
                  </td>
                  <td className="num">{item.rows.toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td colSpan={2}>Jumlah</td>
                <td className="num">{totals.rows.toLocaleString("id-ID")}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="field-hint">
          Template berisi susunan yang sama tanpa data, untuk melihat bentuk berkasnya. Template tidak bisa di-restore. Sesi masuk dan
          riwayat backup tidak ikut di dalam berkas.
        </p>
      </section>

      <section className="panel bkp-remind-panel" id="pengingat" aria-labelledby="bkp-remind">
        <div className="panel-head">
          <h2 id="bkp-remind">Pengingat backup</h2>
        </div>
        <p className="adm-desc">
          Bila sudah waktunya, pita pengingat muncul di atas setiap halaman admin dan menu Backup & Restore diberi tanda sampai
          backup diunduh.
        </p>
        <form action={saveBackupReminder} className="bkp-freq">
          <fieldset>
            <legend className="sr">Jadwal pengingat</legend>
            {(Object.keys(FREQUENCIES) as Frequency[]).map((key) => (
              <label key={key} className="bkp-option">
                <input type="radio" name="frekuensi" value={key} defaultChecked={status.frequency === key} required />
                <span>
                  <strong>{FREQUENCIES[key].label}</strong>
                  <small>{FREQUENCIES[key].hint}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <button type="submit" className="btn">
            Simpan pengingat
          </button>
        </form>
      </section>

      <section className="panel" aria-labelledby="bkp-log">
        <div className="panel-head">
          <h2 id="bkp-log">Riwayat backup & restore</h2>
        </div>
        {logs.length ? (
          <div className="table-wrap">
            <table className="table bkp-table">
              <thead>
                <tr>
                  <th scope="col">Waktu</th>
                  <th scope="col">Jenis</th>
                  <th scope="col">Oleh</th>
                  <th scope="col">Isi</th>
                  <th scope="col">Ukuran</th>
                  <th scope="col">Sidik</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.created_at)}</td>
                    <td>
                      <span className={log.kind === "unduh" ? "badge badge--ok" : "badge badge--warn"}>
                        {log.kind === "unduh" ? "Backup" : "Restore"}
                      </span>
                    </td>
                    <td>{log.user_name}</td>
                    <td>
                      {log.table_count} tabel, {log.row_count.toLocaleString("id-ID")} baris
                    </td>
                    <td>{formatBytes(log.size_bytes)}</td>
                    <td>
                      <code title={log.checksum}>{log.checksum.slice(0, 10)}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="adm-desc">Belum ada backup. Tekan "Backup sekarang" di atas untuk membuat yang pertama.</p>
        )}
      </section>
    </>
  );
}
