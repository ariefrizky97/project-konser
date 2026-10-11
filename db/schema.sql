-- Skema database portal. Aman dijalankan berulang (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS users (
  id            serial PRIMARY KEY,
  name          text NOT NULL,
  email         text NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (lower(email));

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id    integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);

CREATE TABLE IF NOT EXISTS settings (
  key   text PRIMARY KEY,
  value text NOT NULL DEFAULT ''
);

-- Gambar disimpan di ImageKit. Tabel ini hanya mencatat alamat dan id berkasnya
-- supaya bisa dipilih lagi dari pustaka media dan dihapus dari ImageKit.
CREATE TABLE IF NOT EXISTS media (
  id            serial PRIMARY KEY,
  filename      text NOT NULL,
  mime          text NOT NULL,
  bytes         integer NOT NULL,
  url           text NOT NULL DEFAULT '',
  thumbnail_url text NOT NULL DEFAULT '',
  file_id       text NOT NULL DEFAULT '',
  width         integer,
  height        integer,
  uploaded_by   integer REFERENCES users (id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id   serial PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS posts (
  id           serial PRIMARY KEY,
  title        text NOT NULL,
  slug         text NOT NULL UNIQUE,
  excerpt      text NOT NULL DEFAULT '',
  body         text NOT NULL DEFAULT '',
  cover_url    text,
  video_url    text NOT NULL DEFAULT '',
  category_id  integer REFERENCES categories (id) ON DELETE SET NULL,
  author_id    integer REFERENCES users (id) ON DELETE SET NULL,
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured     boolean NOT NULL DEFAULT false,
  views        integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS posts_category_idx ON posts (category_id);

CREATE TABLE IF NOT EXISTS event_types (
  id   serial PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS events (
  id             serial PRIMARY KEY,
  title          text NOT NULL,
  slug           text NOT NULL UNIQUE,
  summary        text NOT NULL DEFAULT '',
  description    text NOT NULL DEFAULT '',
  cover_url      text,
  type_id        integer REFERENCES event_types (id) ON DELETE SET NULL,
  starts_at      timestamptz NOT NULL,
  ends_at        timestamptz,
  all_day        boolean NOT NULL DEFAULT false,
  venue_name     text NOT NULL DEFAULT '',
  city           text NOT NULL DEFAULT '',
  address        text NOT NULL DEFAULT '',
  price_info     text NOT NULL DEFAULT '',
  ticket_url     text NOT NULL DEFAULT '',
  organizer_name text NOT NULL DEFAULT '',
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_start_idx ON events (status, starts_at);

CREATE TABLE IF NOT EXISTS directory_entries (
  id          serial PRIMARY KEY,
  kind        text NOT NULL CHECK (kind IN ('venue', 'artis', 'organizer', 'komunitas', 'vendor')),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  summary     text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  city        text NOT NULL DEFAULT '',
  address     text NOT NULL DEFAULT '',
  contact     text NOT NULL DEFAULT '',
  website     text NOT NULL DEFAULT '',
  instagram   text NOT NULL DEFAULT '',
  cover_url   text,
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS directory_kind_idx ON directory_entries (status, kind, name);

-- Iklan. Setiap iklan menempati satu slot dan memakai satu template.
CREATE TABLE IF NOT EXISTS ads (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  slot       text NOT NULL DEFAULT 'header' CHECK (slot IN ('header', 'inline')),
  template   text NOT NULL DEFAULT 'text' CHECK (template IN ('image', 'text', 'split')),
  tone       text NOT NULL DEFAULT 'sun' CHECK (tone IN ('sun', 'ink', 'plain')),
  headline   text NOT NULL DEFAULT '',
  subline    text NOT NULL DEFAULT '',
  cta_label  text NOT NULL DEFAULT '',
  image_url  text NOT NULL DEFAULT '',
  target_url text NOT NULL DEFAULT '',
  active     boolean NOT NULL DEFAULT true,
  starts_at  timestamptz,
  ends_at    timestamptz,
  clicks     integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ads_slot_idx ON ads (slot, active);

-- Tagar artikel.
CREATE TABLE IF NOT EXISTS tags (
  id   serial PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id integer NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  tag_id  integer NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS post_tags_tag_idx ON post_tags (tag_id);

-- Slide di bagian atas beranda. Jenis foto memakai gambar; jenis video memakai tautan YouTube.
-- Trafik pengunjung. Hanya hitungan harian per halaman dan sidik harian pengunjung
-- (hash sekali pakai dari alamat IP dan browser); alamat IP sendiri tidak disimpan.
CREATE TABLE IF NOT EXISTS page_views (
  day   date NOT NULL,
  path  text NOT NULL,
  views integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

CREATE TABLE IF NOT EXISTS visitors (
  day  date NOT NULL,
  hash text NOT NULL,
  PRIMARY KEY (day, hash)
);

CREATE TABLE IF NOT EXISTS slides (
  id         serial PRIMARY KEY,
  kind       text NOT NULL DEFAULT 'photo' CHECK (kind IN ('photo', 'video')),
  title      text NOT NULL,
  caption    text NOT NULL DEFAULT '',
  image_url  text NOT NULL DEFAULT '',
  video_url  text NOT NULL DEFAULT '',
  link_url   text NOT NULL DEFAULT '',
  sort       integer NOT NULL DEFAULT 0,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Penyesuaian untuk database yang dibuat dengan skema versi awal.
-- Aman dijalankan berulang.
-- ---------------------------------------------------------------------------
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url text NOT NULL DEFAULT '';
-- Warna label per kategori dan per tipe event (heksadesimal, misalnya #C9694A).
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '';
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '';
ALTER TABLE media ADD COLUMN IF NOT EXISTS url text NOT NULL DEFAULT '';
ALTER TABLE media ADD COLUMN IF NOT EXISTS thumbnail_url text NOT NULL DEFAULT '';
ALTER TABLE media ADD COLUMN IF NOT EXISTS file_id text NOT NULL DEFAULT '';
ALTER TABLE media ADD COLUMN IF NOT EXISTS width integer;
ALTER TABLE media ADD COLUMN IF NOT EXISTS height integer;
-- Versi awal menyimpan isi gambar di kolom "data". Sekarang gambar ada di ImageKit.
ALTER TABLE media DROP COLUMN IF EXISTS data;
DELETE FROM media WHERE url = '';

-- ---------------------------------------------------------------------------
-- Fitur tambahan admin: kotak masuk, laporan iklan, SEO dan tinjauan artikel,
-- riwayat versi, halaman statis, buletin, dan catatan aktivitas.
-- ---------------------------------------------------------------------------

-- Artikel: judul dan deskripsi untuk mesin pencari, tautan pratinjau draf,
-- catatan untuk peninjau, dan status "menunggu tinjauan".
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_title text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_description text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS preview_token text NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS review_note text NOT NULL DEFAULT '';
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (status IN ('draft', 'review', 'published'));
CREATE INDEX IF NOT EXISTS posts_preview_idx ON posts (preview_token) WHERE preview_token <> '';

-- Versi artikel sebelum tiap perubahan, supaya bisa dikembalikan.
CREATE TABLE IF NOT EXISTS post_revisions (
  id         serial PRIMARY KEY,
  post_id    integer NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  user_id    integer REFERENCES users (id) ON DELETE SET NULL,
  user_name  text NOT NULL DEFAULT '',
  title      text NOT NULL,
  excerpt    text NOT NULL DEFAULT '',
  body       text NOT NULL DEFAULT '',
  summary    text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS post_revisions_post_idx ON post_revisions (post_id, id DESC);

-- Kotak masuk: pengajuan event, permintaan iklan, dan pesan dari form publik.
CREATE TABLE IF NOT EXISTS messages (
  id         serial PRIMARY KEY,
  kind       text NOT NULL CHECK (kind IN ('event', 'iklan', 'pesan')),
  name       text NOT NULL DEFAULT '',
  email      text NOT NULL DEFAULT '',
  phone      text NOT NULL DEFAULT '',
  subject    text NOT NULL,
  body       text NOT NULL DEFAULT '',
  payload    jsonb NOT NULL DEFAULT '{}',
  status     text NOT NULL DEFAULT 'baru' CHECK (status IN ('baru', 'selesai', 'ditolak')),
  event_id   integer REFERENCES events (id) ON DELETE SET NULL,
  handled_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_status_idx ON messages (status, id DESC);

-- Tayangan dan klik iklan per hari.
CREATE TABLE IF NOT EXISTS ad_stats (
  day    date NOT NULL,
  ad_id  integer NOT NULL REFERENCES ads (id) ON DELETE CASCADE,
  views  integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, ad_id)
);

-- Halaman statis (kebijakan privasi, pedoman, redaksi, dan sejenisnya).
CREATE TABLE IF NOT EXISTS pages (
  id         serial PRIMARY KEY,
  title      text NOT NULL,
  slug       text NOT NULL UNIQUE,
  body       text NOT NULL DEFAULT '',
  status     text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  in_footer  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Pelanggan buletin.
CREATE TABLE IF NOT EXISTS subscribers (
  id         serial PRIMARY KEY,
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_key ON subscribers (lower(email));

-- Catatan aktivitas admin: siapa melakukan apa dan kapan.
CREATE TABLE IF NOT EXISTS activity (
  id         serial PRIMARY KEY,
  user_id    integer REFERENCES users (id) ON DELETE SET NULL,
  user_name  text NOT NULL DEFAULT '',
  action     text NOT NULL,
  href       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_id_idx ON activity (id DESC);

-- Foto profil pengguna (alamat gambar di ImageKit).
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text NOT NULL DEFAULT '';

-- v9: playlist atau video YouTube per kategori untuk blok kategori di beranda.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS youtube text NOT NULL DEFAULT '';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS youtube_title text NOT NULL DEFAULT '';

-- v9: riwayat cadangan (unduh dan pulihkan). Sengaja tanpa kunci asing supaya tidak ikut
-- terhapus saat cadangan dipulihkan.
CREATE TABLE IF NOT EXISTS backups (
  id         serial PRIMARY KEY,
  kind       text NOT NULL CHECK (kind IN ('unduh', 'pulih')),
  file_name  text NOT NULL DEFAULT '',
  size_bytes integer NOT NULL DEFAULT 0,
  checksum   text NOT NULL DEFAULT '',
  table_count integer NOT NULL DEFAULT 0,
  row_count  integer NOT NULL DEFAULT 0,
  user_name  text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS backups_created_idx ON backups (created_at DESC);

-- v12: posisi dan perbesaran foto profil, "x,y,zoom" (misalnya "50,30,1.4"). Kosong = tengah.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_crop text NOT NULL DEFAULT '';
