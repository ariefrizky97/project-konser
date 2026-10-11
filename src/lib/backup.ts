// Cadangan database dari menu Admin > Cadangan.
//
// Cadangan berupa satu berkas JSON berisi semua tabel (kecuali sesi masuk dan riwayat cadangan
// itu sendiri), beserta daftar kolom, jumlah baris, dan sidik SHA-256 isinya. Sidik itu dipakai
// saat memulihkan untuk memastikan berkasnya utuh dan tidak diubah tangan.
//
// Memulihkan berjalan dalam satu transaksi: semua tabel dikosongkan lalu diisi dari berkas,
// dengan urutan mengikuti kunci asing, lalu penomoran id disetel ulang. Bila satu langkah gagal,
// seluruhnya dibatalkan dan database tetap seperti sebelumnya.

import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { one, query, transaction } from "./db";

export const BACKUP_FORMAT = "projectkonser-cadangan";
export const BACKUP_VERSION = 1;
/** Batas ukuran berkas yang diterima saat memulihkan. */
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;
/** Kalimat yang harus diketik untuk memulihkan. */
export const CONFIRM_PHRASE = "PULIHKAN";
/** Tidak ikut dicadangkan: sesi masuk (rahasia, berumur pendek) dan riwayat cadangan. */
const SKIPPED = ["sessions", "backups"];

type Rows = Record<string, unknown>[];
export type BackupDoc = {
  format: string;
  version: number;
  description?: string;
  site: string;
  created_at: string;
  created_by: string;
  checksum: string;
  counts: Record<string, number>;
  columns: Record<string, string[]>;
  tables: Record<string, Rows>;
};

const ident = (name: string) => `"${name.replace(/"/g, '""')}"`;

export const checksumOf = (tables: Record<string, Rows>) => createHash("sha256").update(JSON.stringify(tables)).digest("hex");

/** Tabel dan kolomnya di database saat ini (tanpa tabel yang tidak dicadangkan). */
export async function currentColumns(client?: PoolClient): Promise<Record<string, string[]>> {
  const sql = `SELECT table_name, column_name FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE')
                ORDER BY table_name, ordinal_position`;
  const rows = client
    ? (await client.query<{ table_name: string; column_name: string }>(sql)).rows
    : await query<{ table_name: string; column_name: string }>(sql);
  const out: Record<string, string[]> = {};
  for (const row of rows) {
    if (SKIPPED.includes(row.table_name)) continue;
    (out[row.table_name] ??= []).push(row.column_name);
  }
  return out;
}

/**
 * Urutan dan nama tabel di berkas backup: pengaturan dan akun dulu, lalu isi situs, lalu catatan.
 * Tabel yang tidak ada di daftar ini (misalnya tabel baru) diletakkan di akhir.
 */
export const TABLE_LABELS: Record<string, string> = {
  settings: "Pengaturan situs",
  users: "Pengguna",
  categories: "Kategori berita",
  tags: "Tagar",
  event_types: "Tipe event",
  media: "Media (alamat gambar)",
  posts: "Berita",
  post_tags: "Tagar per berita",
  post_revisions: "Riwayat versi berita",
  events: "Event",
  directory_entries: "Direktori",
  pages: "Halaman",
  slides: "Slide beranda",
  ads: "Iklan",
  ad_stats: "Statistik iklan",
  messages: "Kotak masuk",
  subscribers: "Pelanggan buletin",
  page_views: "Trafik: tayangan per halaman",
  visitors: "Trafik: pengunjung harian",
  activity: "Riwayat admin",
};

export function orderedTables(names: string[]): string[] {
  const known = Object.keys(TABLE_LABELS).filter((name) => names.includes(name));
  return [...known, ...names.filter((name) => !known.includes(name)).sort()];
}

const DESCRIPTION =
  "Backup Project Konser. Susunan: info berkas, ringkasan jumlah baris (counts), daftar kolom (columns), lalu isi tiap tabel (tables), satu baris data per baris. Jangan ubah isinya: sidik (checksum) akan tidak cocok dan berkas ditolak saat restore.";

async function readTables(): Promise<{ columns: Record<string, string[]>; tables: Record<string, Rows> }> {
  return transaction(async (client) => {
    await client.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY");
    const found = await currentColumns(client);
    const columns: Record<string, string[]> = {};
    const tables: Record<string, Rows> = {};
    for (const name of orderedTables(Object.keys(found))) {
      columns[name] = found[name];
      const result = await client.query<{ rows: string }>(
        `SELECT coalesce(json_agg(t ORDER BY t.ctid), '[]')::text AS rows FROM ${ident(name)} t`,
      );
      tables[name] = JSON.parse(result.rows[0]?.rows ?? "[]") as Rows;
    }
    return { columns, tables };
  });
}

function makeDoc(site: string, by: string, columns: Record<string, string[]>, tables: Record<string, Rows>, note = DESCRIPTION): BackupDoc {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    description: note,
    site,
    created_at: new Date().toISOString(),
    created_by: by,
    checksum: checksumOf(tables),
    counts: Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length])),
    columns,
    tables,
  };
}

/**
 * Tulis berkas backup yang rapi dibaca: info di atas, satu tabel per bagian, satu baris data
 * per baris teks. Isinya tetap JSON biasa, jadi bisa dibaca kembali saat restore.
 */
export function formatBackup(doc: BackupDoc): string {
  const json = (value: unknown) => JSON.stringify(value);
  const head = (["format", "version", "description", "site", "created_at", "created_by", "checksum"] as const).map(
    (key) => `  ${json(key)}: ${json(doc[key])}`,
  );
  const names = Object.keys(doc.tables);
  const block = (key: string, lines: string[]) => `  ${json(key)}: {\n${lines.join(",\n")}\n  }`;
  const counts = block("counts", names.map((name) => `    ${json(name)}: ${json(doc.counts[name] ?? doc.tables[name].length)}`));
  const columns = block("columns", Object.keys(doc.columns).map((name) => `    ${json(name)}: ${json(doc.columns[name])}`));
  const tables = block(
    "tables",
    names.map((name) => {
      const rows = doc.tables[name];
      if (!rows.length) return `    ${json(name)}: []`;
      return `    ${json(name)}: [\n${rows.map((row) => `      ${json(row)}`).join(",\n")}\n    ]`;
    }),
  );
  return `{\n${[...head, counts, columns, tables].join(",\n")}\n}\n`;
}

/** Buat backup lengkap. Dibaca dalam satu transaksi supaya isinya konsisten. */
export async function createBackup(by: string, site: string): Promise<{ doc: BackupDoc; body: string }> {
  const { columns, tables } = await readTables();
  const doc = makeDoc(site, by, columns, tables);
  return { doc, body: formatBackup(doc) };
}

/**
 * Template backup: susunan berkas yang sama persis (info, ringkasan, kolom, tabel) tanpa isi.
 * Untuk melihat susunannya; tidak bisa di-restore karena tidak berisi akun admin.
 */
export async function createTemplate(site: string): Promise<string> {
  const found = await currentColumns();
  const columns: Record<string, string[]> = {};
  const tables: Record<string, Rows> = {};
  for (const name of orderedTables(Object.keys(found))) {
    columns[name] = found[name];
    tables[name] = [];
  }
  const doc = makeDoc(
    site,
    "template",
    columns,
    tables,
    "Template backup Project Konser: susunan berkas tanpa isi. Berkas backup asli punya susunan yang sama, dengan baris data di bagian tables. Template ini tidak bisa di-restore.",
  );
  return formatBackup(doc);
}

export type BackupProblem =
  | "cadangan-rusak"
  | "cadangan-format"
  | "cadangan-versi"
  | "cadangan-ubah"
  | "cadangan-tabel"
  | "cadangan-kolom"
  | "cadangan-admin";

/**
 * Periksa isi berkas cadangan sebelum dipulihkan: bisa dibaca, formatnya cocok, sidiknya
 * sama (berkas utuh), tabel dan kolomnya dikenal database ini, jumlah barisnya sesuai,
 * dan ada paling sedikit satu akun admin supaya tidak ada yang terkunci di luar.
 */
export function validateBackup(
  text: string,
  columns: Record<string, string[]>,
): { ok: true; doc: BackupDoc } | { ok: false; problem: BackupProblem; detail?: string } {
  let doc: BackupDoc;
  try {
    doc = JSON.parse(text) as BackupDoc;
  } catch {
    return { ok: false, problem: "cadangan-rusak" };
  }
  if (!doc || typeof doc !== "object" || doc.format !== BACKUP_FORMAT || typeof doc.tables !== "object" || !doc.tables) {
    return { ok: false, problem: "cadangan-format" };
  }
  if (typeof doc.version !== "number" || doc.version > BACKUP_VERSION) return { ok: false, problem: "cadangan-versi" };
  if (typeof doc.checksum !== "string" || checksumOf(doc.tables) !== doc.checksum) return { ok: false, problem: "cadangan-ubah" };

  for (const [name, rows] of Object.entries(doc.tables)) {
    const known = columns[name];
    if (!known || !Array.isArray(rows)) return { ok: false, problem: "cadangan-tabel", detail: name };
    if (doc.counts && typeof doc.counts[name] === "number" && doc.counts[name] !== rows.length) {
      return { ok: false, problem: "cadangan-ubah", detail: name };
    }
    for (const row of rows) {
      if (!row || typeof row !== "object" || Array.isArray(row)) return { ok: false, problem: "cadangan-tabel", detail: name };
      for (const key of Object.keys(row)) {
        if (!known.includes(key)) return { ok: false, problem: "cadangan-kolom", detail: `${name}.${key}` };
      }
    }
  }
  const users = doc.tables.users;
  if (!Array.isArray(users) || !users.some((user) => user.role === "admin" && typeof user.email === "string")) {
    return { ok: false, problem: "cadangan-admin" };
  }
  return { ok: true, doc };
}

/** Urutan isi tabel: tabel induk (yang dirujuk kunci asing) lebih dulu. */
async function insertOrder(client: PoolClient, names: string[]): Promise<string[]> {
  const links = (
    await client.query<{ child: string; parent: string }>(
      `SELECT tc.relname AS child, pc.relname AS parent
         FROM pg_constraint c
         JOIN pg_class tc ON tc.oid = c.conrelid
         JOIN pg_class pc ON pc.oid = c.confrelid
         JOIN pg_namespace n ON n.oid = tc.relnamespace
        WHERE c.contype = 'f' AND n.nspname = 'public'`,
    )
  ).rows.filter((link) => link.child !== link.parent && names.includes(link.child) && names.includes(link.parent));
  const ordered: string[] = [];
  const left = new Set(names);
  while (left.size) {
    const ready = [...left].filter((name) => !links.some((link) => link.child === name && left.has(link.parent)));
    const batch = ready.length ? ready.sort() : [...left].sort();
    for (const name of batch) {
      ordered.push(name);
      left.delete(name);
    }
  }
  return ordered;
}

/** Pulihkan isi cadangan yang sudah lolos validateBackup. Mengembalikan jumlah tabel dan baris. */
export async function restoreBackup(doc: BackupDoc): Promise<{ tables: number; rows: number }> {
  return transaction(async (client) => {
    const columns = await currentColumns(client);
    const names = Object.keys(doc.tables).filter((name) => columns[name]);
    // Sesi masuk disimpan dulu (dengan email pemiliknya), karena ikut terhapus oleh CASCADE.
    // Setelah data dipulihkan, sesi dikembalikan ke akun dengan email yang sama, jadi admin
    // tetap masuk dan tidak perlu login ulang.
    const sessions = (
      await client.query<{ token_hash: string; email: string; expires_at: Date; created_at: Date }>(
        `SELECT s.token_hash, lower(u.email) AS email, s.expires_at, s.created_at
           FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.expires_at > now()`,
      )
    ).rows;
    await client.query(`TRUNCATE ${names.map(ident).join(", ")} RESTART IDENTITY CASCADE`);

    let total = 0;
    for (const name of await insertOrder(client, names)) {
      const rows = doc.tables[name];
      if (!rows.length) continue;
      const keys = columns[name].filter((column) => rows.some((row) => Object.prototype.hasOwnProperty.call(row, column)));
      const list = keys.map(ident).join(", ");
      for (let start = 0; start < rows.length; start += 500) {
        const chunk = rows.slice(start, start + 500);
        await client.query(
          `INSERT INTO ${ident(name)} (${list})
           SELECT ${list} FROM json_populate_recordset(NULL::${ident(name)}, ($1::text)::json)`,
          [JSON.stringify(chunk)],
        );
      }
      total += rows.length;
    }

    // Nomor id berikutnya dilanjutkan dari id terbesar yang dipulihkan.
    const serials = await client.query<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND column_default LIKE 'nextval(%'`,
    );
    for (const { table_name: table, column_name: column } of serials.rows) {
      if (!names.includes(table)) continue;
      await client.query(
        `SELECT setval(pg_get_serial_sequence($1, $2), coalesce((SELECT max(${ident(column)}) FROM ${ident(table)}), 0) + 1, false)`,
        [ident(table), column],
      );
    }
    for (const session of sessions) {
      await client.query(
        `INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
         SELECT $1, id, $3, $4 FROM users WHERE lower(email) = $2
         ON CONFLICT (token_hash) DO NOTHING`,
        [session.token_hash, session.email, session.expires_at, session.created_at],
      );
    }
    return { tables: names.length, rows: total };
  });
}

// ---- Riwayat dan pengingat -----------------------------------------------------------------

export type BackupLog = {
  id: number;
  kind: "unduh" | "pulih";
  file_name: string;
  size_bytes: number;
  checksum: string;
  table_count: number;
  row_count: number;
  user_name: string;
  created_at: Date;
};

export async function logBackup(entry: Omit<BackupLog, "id" | "created_at">): Promise<void> {
  await query(
    `INSERT INTO backups (kind, file_name, size_bytes, checksum, table_count, row_count, user_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [entry.kind, entry.file_name.slice(0, 200), entry.size_bytes, entry.checksum, entry.table_count, entry.row_count, entry.user_name.slice(0, 120)],
  );
}

export async function listBackupLogs(limit = 30): Promise<BackupLog[]> {
  return query<BackupLog>(
    `SELECT id, kind, file_name, size_bytes, checksum, table_count, row_count, user_name, created_at
       FROM backups ORDER BY created_at DESC, id DESC LIMIT $1`,
    [limit],
  );
}

export const FREQUENCIES = {
  mati: { label: "Mati", hint: "Tanpa pengingat." },
  harian: { label: "Harian", hint: "Diingatkan bila belum mencadangkan dalam 1 hari." },
  mingguan: { label: "Mingguan", hint: "Diingatkan bila belum mencadangkan dalam 7 hari." },
  bulanan: { label: "Bulanan", hint: "Diingatkan bila belum mencadangkan dalam 1 bulan." },
  tahunan: { label: "Tahunan", hint: "Diingatkan bila belum mencadangkan dalam 1 tahun." },
} as const;
export type Frequency = keyof typeof FREQUENCIES;
export const DEFAULT_FREQUENCY: Frequency = "mingguan";

export const isFrequency = (value: string): value is Frequency => Object.prototype.hasOwnProperty.call(FREQUENCIES, value);

/** Tanggal jatuh tempo cadangan berikutnya setelah `last`. */
export function nextDue(last: Date, frequency: Frequency): Date | null {
  const due = new Date(last);
  if (frequency === "harian") due.setDate(due.getDate() + 1);
  else if (frequency === "mingguan") due.setDate(due.getDate() + 7);
  else if (frequency === "bulanan") due.setMonth(due.getMonth() + 1);
  else if (frequency === "tahunan") due.setFullYear(due.getFullYear() + 1);
  else return null;
  return due;
}

export type BackupStatus = { frequency: Frequency; last: Date | null; due: Date | null; overdue: boolean };

/** Status pengingat: kapan terakhir mencadangkan dan apakah sudah waktunya lagi. */
export async function getBackupStatus(now: Date = new Date()): Promise<BackupStatus> {
  const [setting, last] = await Promise.all([
    one<{ value: string }>("SELECT value FROM settings WHERE key = 'backup_frequency'"),
    one<{ at: Date | null }>("SELECT max(created_at) AS at FROM backups WHERE kind = 'unduh'"),
  ]);
  const frequency = setting && isFrequency(setting.value) ? setting.value : DEFAULT_FREQUENCY;
  const lastAt = last?.at ? new Date(last.at) : null;
  if (frequency === "mati") return { frequency, last: lastAt, due: null, overdue: false };
  const due = lastAt ? nextDue(lastAt, frequency) : null;
  return { frequency, last: lastAt, due, overdue: !lastAt || (due !== null && due <= now) };
}
