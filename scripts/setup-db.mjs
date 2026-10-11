// Menyiapkan database: membuat tabel, dua akun admin, dan data contoh.
//
//   npm run db:setup                  buat tabel; isi data contoh bila masih kosong
//   npm run db:setup -- --tanpa-contoh   buat tabel dan admin saja
//   npm run db:reset                  HAPUS semua tabel lalu buat ulang dari awal

import { randomBytes, scrypt } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import * as seed from "./seed-data.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const reset = args.includes("--reset");
const withSamples = !args.includes("--tanpa-contoh");

// Baca .env secara sederhana. Variabel yang sudah ada di lingkungan tidak ditimpa.
const envPath = join(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line);
    if (!match || line.trim().startsWith("#")) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL belum diisi. Salin .env.example menjadi .env lalu isi alamat PostgreSQL Anda.");
  process.exit(1);
}

// Harus sama dengan hashPassword di src/lib/auth.ts.
function hashPassword(password) {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(`scrypt$${salt.toString("hex")}$${key.toString("hex")}`);
    });
  });
}

function slugify(input) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const run = (text, params = []) => pool.query(text, params);
const count = async (table) => (await run(`SELECT count(*)::int AS total FROM ${table}`)).rows[0].total;

async function main() {
  if (reset) {
    console.log("Menghapus semua tabel...");
    await run(
      `DROP TABLE IF EXISTS backups, activity, subscribers, pages, ad_stats, messages, post_revisions, page_views, visitors, slides, post_tags, tags, ads, directory_entries, events, event_types,
         posts, categories, media, settings, sessions, users CASCADE`,
    );
  }

  console.log("Membuat tabel...");
  await run(readFileSync(join(root, "db", "schema.sql"), "utf8"));

  // Penyesuaian data untuk database yang sudah ada:
  // 1. Kategori dan tipe event yang belum punya warna label diberi warna bawaan, tiap baris berbeda.
  const palette = ["#f2c230", "#c9694a", "#3f7c8c", "#7c8b4e", "#8a5a83", "#55629b", "#3e7a5e", "#b5523b", "#6f6a5c"];
  for (const table of ["categories", "event_types"]) {
    const rows = (await run(`SELECT id, color FROM ${table} ORDER BY sort, id`)).rows;
    for (const [index, row] of rows.entries()) {
      if (!row.color) await run(`UPDATE ${table} SET color = $1 WHERE id = $2`, [palette[index % palette.length], row.id]);
    }
  }
  // 2. Tautan media sosial contoh dari versi awal diganti dengan akun Project Konser.
  await run("UPDATE settings SET value = 'https://www.instagram.com/projectkonser' WHERE key = 'instagram' AND value IN ('', 'https://instagram.com/')");
  await run("UPDATE settings SET value = '' WHERE key = 'youtube' AND value = 'https://youtube.com/'");
  await run(
    `INSERT INTO settings (key, value) VALUES ('tiktok', 'https://www.tiktok.com/@projectkonser')
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value WHERE settings.value = ''`,
  );
  // Kanal YouTube Project Konser ditambahkan sekali (ditandai), kecuali admin sudah mengisi yang lain.
  if (!(await run("SELECT 1 FROM settings WHERE key = 'youtube_v12'")).rows.length) {
    await run(
      `INSERT INTO settings (key, value) VALUES ('youtube', 'https://www.youtube.com/@projectkonser')
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value WHERE settings.value = ''`,
    );
    await run("INSERT INTO settings (key, value) VALUES ('youtube_v12', '1') ON CONFLICT (key) DO NOTHING");
  }
  // Akun Threads ditambahkan sekali; bila admin mengosongkannya nanti, tidak diisi ulang.
  await run(
    `INSERT INTO settings (key, value) VALUES ('threads', 'https://www.threads.com/@projectkonser')
     ON CONFLICT (key) DO NOTHING`,
  );

  // 3. Kategori berita menjadi empat: Liputan Event, Musik, Film, Press Release. Dijalankan sekali
  //    (ditandai di settings), jadi kategori yang nanti ditambah atau diubah admin tidak disentuh.
  const categoriesDone = await run("SELECT 1 FROM settings WHERE key = 'kategori_v9'");
  if (!categoriesDone.rows.length) {
    const targets = [
      { from: "liputan", name: "Liputan Event", slug: "liputan-event", sort: 1, color: "#3f7c8c" },
      { from: "musik", name: "Musik", slug: "musik", sort: 2, color: "#e2478b" },
      { from: "film", name: "Film", slug: "film", sort: 3, color: "#ec8b2c" },
      { from: "siaran-pers", name: "Press Release", slug: "press-release", sort: 4, color: "#7c8b4e" },
    ];
    for (const item of targets) {
      await run(
        `UPDATE categories SET name = $2, slug = $3, sort = $4
          WHERE slug = $1 AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = $3 AND slug <> $1)`,
        [item.from, item.name, item.slug, item.sort],
      );
      await run(
        "INSERT INTO categories (name, slug, sort, color) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING",
        [item.name, item.slug, item.sort, item.color],
      );
    }
    // Kategori contoh lama "Gaya Hidup": artikelnya pindah ke Liputan Event, kategorinya dihapus.
    const moved = await run(
      `UPDATE posts SET category_id = (SELECT id FROM categories WHERE slug = 'liputan-event')
        WHERE category_id = (SELECT id FROM categories WHERE slug = 'gaya-hidup')`,
    );
    await run("DELETE FROM categories WHERE slug = 'gaya-hidup'");
    await run("INSERT INTO settings (key, value) VALUES ('kategori_v9', '1') ON CONFLICT (key) DO NOTHING");
    console.log(
      `Kategori disesuaikan: Liputan Event, Musik, Film, Press Release${moved.rowCount ? ` (${moved.rowCount} artikel Gaya Hidup dipindah ke Liputan Event)` : ""}.`,
    );
  }

  // Dua akun admin. Nama dan email bisa diganti lewat .env; kata sandi awalnya sama
  // (ADMIN_PASSWORD) dan sebaiknya langsung diganti masing-masing setelah masuk.
  const password = process.env.ADMIN_PASSWORD || "ganti-sandi-ini";
  const admins = [
    {
      name: process.env.ADMIN_1_NAME || "Arief Rizky",
      email: (process.env.ADMIN_1_EMAIL || "arief.rizky@contoh.id").toLowerCase(),
    },
    {
      name: process.env.ADMIN_2_NAME || "Andhika",
      email: (process.env.ADMIN_2_EMAIL || "andhika@contoh.id").toLowerCase(),
    },
  ];
  const adminIds = [];
  for (const admin of admins) {
    const existing = await run("SELECT id FROM users WHERE lower(email) = $1", [admin.email]);
    if (existing.rows.length) {
      adminIds.push(existing.rows[0].id);
      console.log(`Akun ${admin.email} sudah ada, dilewati.`);
      continue;
    }
    const inserted = await run(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin') RETURNING id",
      [admin.name, admin.email, await hashPassword(password)],
    );
    adminIds.push(inserted.rows[0].id);
    console.log(`Akun admin dibuat: ${admin.name} <${admin.email}>`);
  }
  if (password === "ganti-sandi-ini") {
    console.log("  Kata sandi masih bawaan. Ganti lewat menu Pengguna setelah masuk.");
  }

  if (!withSamples) {
    console.log("Data contoh dilewati.");
  } else if ((await count("posts")) + (await count("events")) + (await count("directory_entries")) > 0) {
    console.log("Database sudah berisi konten, data contoh dilewati.");
  } else {
    console.log("Mengisi data contoh...");

    for (const [key, value] of Object.entries(seed.settings)) {
      await run(
        "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
        [key, value],
      );
    }

    const categoryIds = {};
    for (const item of seed.categories) {
      const row = await run(
        `INSERT INTO categories (name, slug, sort, color) VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [item.name, item.slug, item.sort, item.color],
      );
      categoryIds[item.slug] = row.rows[0].id;
    }

    const typeIds = {};
    for (const item of seed.eventTypes) {
      const row = await run(
        `INSERT INTO event_types (name, slug, sort, color) VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [item.name, item.slug, item.sort, item.color],
      );
      typeIds[item.slug] = row.rows[0].id;
    }

    for (const [index, post] of seed.posts.entries()) {
      const inserted = await run(
        `INSERT INTO posts
           (title, slug, excerpt, body, category_id, author_id, status, featured, views, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          post.title,
          slugify(post.title),
          post.excerpt,
          post.body,
          categoryIds[post.category] ?? null,
          // Artikel contoh dibagi bergantian ke kedua admin.
          adminIds[index % adminIds.length],
          post.status ?? "published",
          post.featured ?? false,
          post.views ?? 0,
          post.published_at,
        ],
      );
      for (const name of seed.postTags[post.title] ?? []) {
        const tag = await run(
          `INSERT INTO tags (name, slug) VALUES ($1, $2)
           ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id`,
          [name, name.toLowerCase()],
        );
        await run("INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [
          inserted.rows[0].id,
          tag.rows[0].id,
        ]);
      }
    }

    for (const event of seed.events) {
      await run(
        `INSERT INTO events
           (title, slug, summary, description, type_id, starts_at, ends_at, all_day, venue_name,
            city, address, price_info, ticket_url, organizer_name, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'published')`,
        [
          event.title,
          slugify(event.title),
          event.summary,
          event.description,
          typeIds[event.type] ?? null,
          event.starts_at,
          event.ends_at ?? null,
          event.all_day ?? false,
          event.venue_name ?? "",
          event.city ?? "",
          event.address ?? "",
          event.price_info ?? "",
          event.ticket_url ?? "",
          event.organizer_name ?? "",
        ],
      );
    }

    for (const entry of seed.directory) {
      await run(
        `INSERT INTO directory_entries
           (kind, name, slug, summary, description, city, address, contact, website, instagram, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'published')`,
        [
          entry.kind,
          entry.name,
          slugify(entry.name),
          entry.summary,
          entry.description,
          entry.city ?? "",
          entry.address ?? "",
          entry.contact ?? "",
          entry.website ?? "",
          entry.instagram ?? "",
        ],
      );
    }

    for (const ad of seed.ads) {
      await run(
        `INSERT INTO ads (name, slot, template, tone, headline, subline, cta_label, image_url, target_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [ad.name, ad.slot, ad.template, ad.tone, ad.headline, ad.subline, ad.cta_label, ad.image_url, ad.target_url],
      );
    }

    for (const slide of seed.slides) {
      await run(
        `INSERT INTO slides (kind, title, caption, image_url, video_url, link_url, sort)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          slide.kind,
          slide.title,
          slide.caption ?? "",
          slide.image_url ?? "",
          slide.video_url ?? "",
          slide.link_url ?? "",
          slide.sort ?? 0,
        ],
      );
    }

    console.log(
      `  ${seed.posts.length} artikel, ${seed.events.length} event, ${seed.directory.length} entri direktori, ${seed.ads.length} iklan, ${seed.slides.length} slide.`,
    );
  }

  console.log("Selesai. Jalankan `npm run dev` lalu buka /admin untuk masuk.");
}

main()
  .catch((error) => {
    console.error("Gagal menyiapkan database:");
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
