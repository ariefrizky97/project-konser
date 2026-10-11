import { Pool, type PoolClient, type QueryResultRow } from "pg";

// Satu pool dipakai ulang selama proses hidup. Di mode dev, Next memuat ulang
// modul berkali-kali, jadi pool disimpan di globalThis agar koneksi tidak menumpuk.
const store = globalThis as unknown as { __pgPool?: Pool };

function getPool(): Pool {
  if (!store.__pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL belum diisi. Salin .env.example menjadi .env lalu isi alamat PostgreSQL Anda.",
      );
    }
    store.__pgPool = new Pool({ connectionString, max: 10 });
  }
  return store.__pgPool;
}

/** Jalankan query dan kembalikan semua baris. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

/** Jalankan query dan kembalikan baris pertama, atau null bila kosong. */
export async function one<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Jalankan beberapa query dalam satu transaksi. */
export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
