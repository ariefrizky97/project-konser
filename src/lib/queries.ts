import { one, query } from "./db";
import { TIME_ZONE } from "./format";
import { thumb } from "./media";
import type {
  Ad,
  AdSlotName,
  Category,
  CategoryWithCount,
  DirectoryEntry,
  DirectoryKind,
  EventItem,
  EventType,
  MediaItem,
  Activity,
  Message,
  MessageKind,
  MessageStatus,
  Page,
  Post,
  PostRevision,
  PostStatus,
  Subscriber,
  Slide,
  Status,
  Tag,
  TagWithCount,
  User,
} from "./types";

/** Escape karakter khusus LIKE supaya kata kunci dicari apa adanya. */
function likePattern(keyword: string): string {
  return `%${keyword.trim().replace(/[\\%_]/g, "\\$&")}%`;
}

// ---------------------------------------------------------------------------
// Berita
// ---------------------------------------------------------------------------

// Isi artikel hanya diambil di halaman detail dan form sunting.
function postSelect(withBody: boolean): string {
  return `
    SELECT p.id, p.title, p.slug, p.excerpt,
           ${withBody ? "p.body" : "''::text AS body"},
           p.cover_url, p.video_url, p.category_id, c.name AS category_name, c.slug AS category_slug, c.color AS category_color,
           p.author_id, u.name AS author_name, u.avatar_url AS author_avatar, u.avatar_crop AS author_avatar_crop, p.status, p.featured, p.views,
           p.seo_title, p.seo_description, p.preview_token, p.review_note,
           p.published_at, p.created_at, p.updated_at
      FROM posts p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN users u ON u.id = p.author_id`;
}

// Artikel tampil bila berstatus terbit dan waktu terbitnya sudah lewat.
// Waktu terbit di masa depan berarti artikel terjadwal.
const POST_LIVE = "p.status = 'published' AND p.published_at <= now()";

// Syarat "artikel punya tagar ini", dipakai di daftar dan hitungan.
function hasTag(position: number): string {
  return `EXISTS (
    SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
     WHERE pt.post_id = p.id AND t.slug = $${position})`;
}

export async function listPosts(options: {
  categorySlug?: string;
  tagSlug?: string;
  limit: number;
  offset?: number;
  excludeIds?: number[];
}): Promise<Post[]> {
  const params: unknown[] = [];
  const where = [POST_LIVE];
  if (options.categorySlug) {
    params.push(options.categorySlug);
    where.push(`c.slug = $${params.length}`);
  }
  if (options.tagSlug) {
    params.push(options.tagSlug);
    where.push(hasTag(params.length));
  }
  if (options.excludeIds?.length) {
    // Dikirim sebagai teks "1,2,3" lalu diubah menjadi array di sisi database.
    params.push(options.excludeIds.join(","));
    where.push(`p.id <> ALL(string_to_array($${params.length}, ',')::int[])`);
  }
  params.push(options.limit, options.offset ?? 0);
  return query<Post>(
    `${postSelect(false)}
      WHERE ${where.join(" AND ")}
      ORDER BY p.published_at DESC, p.id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
}

export async function countPosts(options: { categorySlug?: string; tagSlug?: string } = {}): Promise<number> {
  const params: unknown[] = [];
  const where = [POST_LIVE];
  if (options.categorySlug) {
    params.push(options.categorySlug);
    where.push(`c.slug = $${params.length}`);
  }
  if (options.tagSlug) {
    params.push(options.tagSlug);
    where.push(hasTag(params.length));
  }
  const row = await one<{ total: number }>(
    `SELECT count(*)::int AS total
       FROM posts p LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${where.join(" AND ")}`,
    params,
  );
  return row?.total ?? 0;
}

/** Artikel utama beranda: yang ditandai utama paling baru, atau artikel terbaru. */
export async function getLeadPost(): Promise<Post | null> {
  return one<Post>(
    `${postSelect(false)}
      WHERE ${POST_LIVE}
      ORDER BY p.featured DESC, p.published_at DESC, p.id DESC
      LIMIT 1`,
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return one<Post>(`${postSelect(true)} WHERE p.slug = $1 AND ${POST_LIVE}`, [slug]);
}

export async function listPopularPosts(limit: number): Promise<Post[]> {
  return query<Post>(
    `${postSelect(false)}
      WHERE ${POST_LIVE}
      ORDER BY p.views DESC, p.published_at DESC
      LIMIT $1`,
    [limit],
  );
}

export async function listRelatedPosts(post: Post, limit: number): Promise<Post[]> {
  return query<Post>(
    `${postSelect(false)}
      WHERE ${POST_LIVE} AND p.id <> $1
      ORDER BY (SELECT count(*) FROM post_tags mine JOIN post_tags theirs ON theirs.tag_id = mine.tag_id
                 WHERE mine.post_id = p.id AND theirs.post_id = $1) DESC,
               (p.category_id IS NOT DISTINCT FROM $2) DESC, p.published_at DESC
      LIMIT $3`,
    [post.id, post.category_id, limit],
  );
}

export async function searchPosts(keyword: string, limit: number): Promise<Post[]> {
  return query<Post>(
    `${postSelect(false)}
      WHERE ${POST_LIVE}
        AND (p.title ILIKE $1 OR p.excerpt ILIKE $1 OR p.body ILIKE $1
             OR EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
                         WHERE pt.post_id = p.id AND t.name ILIKE $1))
      ORDER BY (p.title ILIKE $1) DESC, p.published_at DESC
      LIMIT $2`,
    // Tanda # di depan kata kunci diabaikan supaya "#konser" menemukan tagar konser.
    [likePattern(keyword.replace(/^#+/, "")), limit],
  );
}

export async function incrementPostViews(id: number): Promise<void> {
  await query("UPDATE posts SET views = views + 1 WHERE id = $1", [id]);
}

export async function adminListPosts(options: {
  keyword?: string;
  status?: PostStatus;
}): Promise<Post[]> {
  const params: unknown[] = [];
  const where: string[] = [];
  if (options.keyword) {
    params.push(likePattern(options.keyword));
    where.push(`p.title ILIKE $${params.length}`);
  }
  if (options.status) {
    params.push(options.status);
    where.push(`p.status = $${params.length}`);
  }
  return query<Post>(
    `${postSelect(false)}
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY p.updated_at DESC
      LIMIT 200`,
    params,
  );
}

export async function getPostById(id: number): Promise<Post | null> {
  return one<Post>(`${postSelect(true)} WHERE p.id = $1`, [id]);
}

// ---------------------------------------------------------------------------
// Tagar
// ---------------------------------------------------------------------------

export async function getPostTags(postId: number): Promise<Tag[]> {
  return query<Tag>(
    `SELECT t.id, t.name, t.slug
       FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
      WHERE pt.post_id = $1
      ORDER BY t.name`,
    [postId],
  );
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  return one<Tag>("SELECT id, name, slug FROM tags WHERE slug = $1", [slug]);
}

/** Tagar yang paling banyak dipakai artikel yang sudah tayang. */
export async function listPopularTags(limit: number): Promise<TagWithCount[]> {
  return query<TagWithCount>(
    `SELECT t.id, t.name, t.slug, count(*)::int AS post_count
       FROM tags t
       JOIN post_tags pt ON pt.tag_id = t.id
       JOIN posts p ON p.id = pt.post_id
      WHERE ${POST_LIVE}
      GROUP BY t.id
      ORDER BY post_count DESC, t.name
      LIMIT $1`,
    [limit],
  );
}

/** Semua nama tagar, untuk saran saat menulis artikel. */
export async function listTagNames(): Promise<string[]> {
  const rows = await query<{ name: string }>("SELECT name FROM tags ORDER BY name LIMIT 300");
  return rows.map((row) => row.name);
}

// ---------------------------------------------------------------------------
// Kategori
// ---------------------------------------------------------------------------

export async function listCategories(): Promise<Category[]> {
  return query<Category>("SELECT id, name, slug, sort, color, youtube, youtube_title FROM categories ORDER BY sort, name");
}

export async function listCategoriesWithCount(): Promise<CategoryWithCount[]> {
  return query<CategoryWithCount>(
    `SELECT c.id, c.name, c.slug, c.sort, c.color, c.youtube, c.youtube_title, count(p.id)::int AS post_count
       FROM categories c
       LEFT JOIN posts p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.sort, c.name`,
  );
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return one<Category>("SELECT id, name, slug, sort, color, youtube, youtube_title FROM categories WHERE slug = $1", [slug]);
}

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

const EVENT_SELECT = `
  SELECT e.id, e.title, e.slug, e.summary, e.description, e.cover_url,
         e.type_id, t.name AS type_name, t.slug AS type_slug, t.color AS type_color,
         e.starts_at, e.ends_at, e.all_day, e.venue_name, e.city, e.address,
         e.price_info, e.ticket_url, e.organizer_name, e.status,
         e.created_at, e.updated_at
    FROM events e
    LEFT JOIN event_types t ON t.id = e.type_id`;

const EVENT_LIVE = "e.status = 'published'";
// Event dianggap masih berjalan sampai waktu selesainya lewat.
const EVENT_END = "COALESCE(e.ends_at, e.starts_at + interval '6 hours')";

/**
 * Daftar event. Tanpa rentang waktu: event yang akan datang atau sedang berlangsung.
 * Dengan rentang waktu: semua event yang bersinggungan dengan rentang itu.
 */
export async function listEvents(options: {
  typeSlug?: string;
  range?: { start: Date; end: Date };
  limit: number;
  excludeId?: number;
}): Promise<EventItem[]> {
  const params: unknown[] = [];
  const where = [EVENT_LIVE];
  if (options.range) {
    params.push(options.range.start, options.range.end);
    where.push(`e.starts_at < $2 AND ${EVENT_END} >= $1`);
  } else {
    where.push(`${EVENT_END} >= now()`);
  }
  if (options.typeSlug) {
    params.push(options.typeSlug);
    where.push(`t.slug = $${params.length}`);
  }
  if (options.excludeId) {
    params.push(options.excludeId);
    where.push(`e.id <> $${params.length}`);
  }
  params.push(options.limit);
  return query<EventItem>(
    `${EVENT_SELECT}
      WHERE ${where.join(" AND ")}
      ORDER BY e.starts_at, e.id
      LIMIT $${params.length}`,
    params,
  );
}

export async function listPastEvents(limit: number): Promise<EventItem[]> {
  return query<EventItem>(
    `${EVENT_SELECT}
      WHERE ${EVENT_LIVE} AND ${EVENT_END} < now()
      ORDER BY e.starts_at DESC
      LIMIT $1`,
    [limit],
  );
}

export async function getEventBySlug(slug: string): Promise<EventItem | null> {
  return one<EventItem>(`${EVENT_SELECT} WHERE e.slug = $1 AND ${EVENT_LIVE}`, [slug]);
}

/** Bulan-bulan (WIB) yang punya event mendatang, untuk pilihan filter. Format "2026-10". */
export async function listEventMonths(): Promise<string[]> {
  const rows = await query<{ key: string }>(
    `SELECT DISTINCT to_char(e.starts_at AT TIME ZONE '${TIME_ZONE}', 'YYYY-MM') AS key
       FROM events e
      WHERE ${EVENT_LIVE} AND ${EVENT_END} >= now()
      ORDER BY key
      LIMIT 12`,
  );
  return rows.map((row) => row.key);
}

export async function searchEvents(keyword: string, limit: number): Promise<EventItem[]> {
  return query<EventItem>(
    `${EVENT_SELECT}
      WHERE ${EVENT_LIVE}
        AND (e.title ILIKE $1 OR e.summary ILIKE $1 OR e.venue_name ILIKE $1 OR e.city ILIKE $1)
      ORDER BY (${EVENT_END} >= now()) DESC, e.starts_at DESC
      LIMIT $2`,
    [likePattern(keyword), limit],
  );
}

/** Event mendatang di sebuah venue atau dari sebuah penyelenggara, dicocokkan lewat nama. */
export async function listEventsByName(name: string, limit: number): Promise<EventItem[]> {
  return query<EventItem>(
    `${EVENT_SELECT}
      WHERE ${EVENT_LIVE} AND ${EVENT_END} >= now()
        AND (lower(e.venue_name) = lower($1) OR lower(e.organizer_name) = lower($1))
      ORDER BY e.starts_at
      LIMIT $2`,
    [name, limit],
  );
}

export async function adminListEvents(keyword?: string): Promise<EventItem[]> {
  const params: unknown[] = [];
  let where = "";
  if (keyword) {
    params.push(likePattern(keyword));
    where = "WHERE e.title ILIKE $1";
  }
  return query<EventItem>(`${EVENT_SELECT} ${where} ORDER BY e.starts_at DESC LIMIT 200`, params);
}

export async function getEventById(id: number): Promise<EventItem | null> {
  return one<EventItem>(`${EVENT_SELECT} WHERE e.id = $1`, [id]);
}

export async function listEventTypes(): Promise<EventType[]> {
  return query<EventType>("SELECT id, name, slug, sort, color FROM event_types ORDER BY sort, name");
}

// ---------------------------------------------------------------------------
// Direktori
// ---------------------------------------------------------------------------

const DIRECTORY_SELECT = `
  SELECT id, kind, name, slug, summary, description, city, address, contact,
         website, instagram, cover_url, status, created_at, updated_at
    FROM directory_entries`;

export async function listDirectory(options: {
  kind?: DirectoryKind;
  limit?: number;
}): Promise<DirectoryEntry[]> {
  const params: unknown[] = [];
  const where = ["status = 'published'"];
  if (options.kind) {
    params.push(options.kind);
    where.push(`kind = $${params.length}`);
  }
  params.push(options.limit ?? 200);
  return query<DirectoryEntry>(
    `${DIRECTORY_SELECT} WHERE ${where.join(" AND ")} ORDER BY name LIMIT $${params.length}`,
    params,
  );
}

export async function countDirectoryByKind(): Promise<Record<string, number>> {
  const rows = await query<{ kind: string; total: number }>(
    `SELECT kind, count(*)::int AS total
       FROM directory_entries WHERE status = 'published' GROUP BY kind`,
  );
  return Object.fromEntries(rows.map((row) => [row.kind, row.total]));
}

export async function getDirectoryBySlug(slug: string): Promise<DirectoryEntry | null> {
  return one<DirectoryEntry>(`${DIRECTORY_SELECT} WHERE slug = $1 AND status = 'published'`, [
    slug,
  ]);
}

export async function searchDirectory(keyword: string, limit: number): Promise<DirectoryEntry[]> {
  return query<DirectoryEntry>(
    `${DIRECTORY_SELECT}
      WHERE status = 'published' AND (name ILIKE $1 OR summary ILIKE $1 OR city ILIKE $1)
      ORDER BY name LIMIT $2`,
    [likePattern(keyword), limit],
  );
}

export async function adminListDirectory(keyword?: string): Promise<DirectoryEntry[]> {
  const params: unknown[] = [];
  let where = "";
  if (keyword) {
    params.push(likePattern(keyword));
    where = "WHERE name ILIKE $1";
  }
  return query<DirectoryEntry>(`${DIRECTORY_SELECT} ${where} ORDER BY kind, name LIMIT 300`, params);
}

export async function getDirectoryById(id: number): Promise<DirectoryEntry | null> {
  return one<DirectoryEntry>(`${DIRECTORY_SELECT} WHERE id = $1`, [id]);
}

// ---------------------------------------------------------------------------
// Iklan
// ---------------------------------------------------------------------------

const AD_SELECT = `
  SELECT id, name, slot, template, tone, headline, subline, cta_label, image_url,
         target_url, active, starts_at, ends_at, clicks, created_at, updated_at
    FROM ads`;

/**
 * Iklan yang tayang di sebuah slot saat ini. Bila ada lebih dari satu iklan aktif,
 * satu dipilih acak setiap permintaan sehingga iklan bergiliran.
 */
export async function getActiveAd(slot: AdSlotName): Promise<Ad | null> {
  return one<Ad>(
    `${AD_SELECT}
      WHERE slot = $1 AND active
        AND (starts_at IS NULL OR starts_at <= now())
        AND (ends_at IS NULL OR ends_at >= now())
      ORDER BY random()
      LIMIT 1`,
    [slot],
  );
}

export async function adminListAds(): Promise<Ad[]> {
  return query<Ad>(`${AD_SELECT} ORDER BY slot, active DESC, updated_at DESC`);
}

export async function getAdById(id: number): Promise<Ad | null> {
  return one<Ad>(`${AD_SELECT} WHERE id = $1`, [id]);
}

/** Catat satu klik dan kembalikan alamat tujuan iklan. */
export async function registerAdClick(id: number): Promise<string | null> {
  const row = await one<{ target_url: string }>(
    "UPDATE ads SET clicks = clicks + 1 WHERE id = $1 RETURNING target_url",
    [id],
  );
  if (row) {
    await query(
      `INSERT INTO ad_stats (day, ad_id, clicks) VALUES ((now() AT TIME ZONE 'Asia/Jakarta')::date, $1, 1)
       ON CONFLICT (day, ad_id) DO UPDATE SET clicks = ad_stats.clicks + 1`,
      [id],
    );
  }
  return row?.target_url || null;
}

/** Catat satu tayangan untuk tiap iklan yang tampil di halaman yang dibuka pengunjung. */
export async function registerAdViews(ids: number[]): Promise<void> {
  if (!ids.length) return;
  await query(
    `INSERT INTO ad_stats (day, ad_id, views)
     SELECT (now() AT TIME ZONE 'Asia/Jakarta')::date, a.id, 1 FROM ads a
      WHERE a.id = ANY(string_to_array($1, ',')::int[])
     ON CONFLICT (day, ad_id) DO UPDATE SET views = ad_stats.views + 1`,
    [ids.join(",")],
  );
}

export type AdReportRow = { id: number; name: string; slot: string; template: string; live: boolean; ends_at: Date | null; views: number; clicks: number };
export type AdReport = {
  days: { day: string; views: number; clicks: number }[];
  rows: AdReportRow[];
  views: number;
  clicks: number;
  live: number;
};

/** Tayangan dan klik iklan selama `span` hari terakhir: per hari dan per iklan. */
export async function getAdReport(span = 30): Promise<AdReport> {
  const length = Math.min(90, Math.max(7, Math.trunc(span)));
  const today = "(now() AT TIME ZONE 'Asia/Jakarta')::date";
  const [days, rows] = await Promise.all([
    query<{ day: string; views: number; clicks: number }>(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
              COALESCE(sum(s.views), 0)::int AS views, COALESCE(sum(s.clicks), 0)::int AS clicks
         FROM generate_series(${today} - ($1::int - 1), ${today}, interval '1 day') AS d(day)
         LEFT JOIN ad_stats s ON s.day = d.day
        GROUP BY d.day ORDER BY d.day`,
      [length],
    ),
    query<AdReportRow>(
      `SELECT a.id, a.name, a.slot, a.template, a.ends_at,
              (a.active AND (a.starts_at IS NULL OR a.starts_at <= now())
                        AND (a.ends_at IS NULL OR a.ends_at >= now())) AS live,
              COALESCE(sum(s.views), 0)::int AS views, COALESCE(sum(s.clicks), 0)::int AS clicks
         FROM ads a
         LEFT JOIN ad_stats s ON s.ad_id = a.id AND s.day > ${today} - $1::int
        GROUP BY a.id
        ORDER BY views DESC, a.id`,
      [length],
    ),
  ]);
  return {
    days,
    rows,
    views: days.reduce((sum, row) => sum + row.views, 0),
    clicks: days.reduce((sum, row) => sum + row.clicks, 0),
    live: rows.filter((row) => row.live).length,
  };
}

/** Tayangan dan klik satu iklan per hari, untuk laporan yang diunduh. */
export async function getAdDaily(id: number, span = 90): Promise<{ day: string; views: number; clicks: number }[]> {
  return query(
    `SELECT to_char(day, 'YYYY-MM-DD') AS day, views, clicks FROM ad_stats
      WHERE ad_id = $1 AND day > (now() AT TIME ZONE 'Asia/Jakarta')::date - $2::int ORDER BY day`,
    [id, span],
  );
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

const MEDIA_SELECT = `
  SELECT id, filename, mime, bytes, url, thumbnail_url, file_id, width, height, created_at
    FROM media`;

export async function listMedia(limit = 120): Promise<MediaItem[]> {
  return query<MediaItem>(`${MEDIA_SELECT} ORDER BY id DESC LIMIT $1`, [limit]);
}

/** Gambar terbaru untuk pemilih gambar di form admin. */
export async function listPickerItems(): Promise<{ id: number; filename: string; url: string; thumb: string }[]> {
  const items = await listMedia(60);
  return items.map((item) => ({
    id: item.id,
    filename: item.filename,
    url: item.url,
    thumb: thumb(item.url, 240),
  }));
}

export async function getMediaById(id: number): Promise<MediaItem | null> {
  return one<MediaItem>(`${MEDIA_SELECT} WHERE id = $1`, [id]);
}

// ---------------------------------------------------------------------------
// Slide beranda
// ---------------------------------------------------------------------------

const SLIDE_SELECT = `
  SELECT id, kind, title, caption, image_url, video_url, link_url, sort, active,
         created_at, updated_at
    FROM slides`;

export async function listActiveSlides(): Promise<Slide[]> {
  return query<Slide>(`${SLIDE_SELECT} WHERE active ORDER BY sort, id LIMIT 8`);
}

export async function adminListSlides(): Promise<Slide[]> {
  return query<Slide>(`${SLIDE_SELECT} ORDER BY sort, id`);
}

export async function getSlideById(id: number): Promise<Slide | null> {
  return one<Slide>(`${SLIDE_SELECT} WHERE id = $1`, [id]);
}

// ---------------------------------------------------------------------------
// Pengguna dan dasbor
// ---------------------------------------------------------------------------

export async function listUsers(): Promise<User[]> {
  return query<User>("SELECT id, name, email, role, avatar_url, avatar_crop, created_at FROM users ORDER BY id");
}

export type DashboardStats = {
  posts_published: number;
  posts_draft: number;
  posts_scheduled: number;
  events_upcoming: number;
  directory_total: number;
  ads_active: number;
  views_total: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const row = await one<DashboardStats>(
    `SELECT
       (SELECT count(*)::int FROM posts WHERE status = 'published' AND published_at <= now()) AS posts_published,
       (SELECT count(*)::int FROM posts WHERE status = 'draft') AS posts_draft,
       (SELECT count(*)::int FROM posts WHERE status = 'published' AND published_at > now()) AS posts_scheduled,
       (SELECT count(*)::int FROM events e WHERE ${EVENT_LIVE} AND ${EVENT_END} >= now()) AS events_upcoming,
       (SELECT count(*)::int FROM directory_entries WHERE status = 'published') AS directory_total,
       (SELECT count(*)::int FROM ads WHERE active
           AND (starts_at IS NULL OR starts_at <= now())
           AND (ends_at IS NULL OR ends_at >= now())) AS ads_active,
       (SELECT COALESCE(sum(views), 0)::int FROM posts) AS views_total`,
  );
  return (
    row ?? {
      posts_published: 0,
      posts_draft: 0,
      posts_scheduled: 0,
      events_upcoming: 0,
      directory_total: 0,
      ads_active: 0,
      views_total: 0,
    }
  );
}

// ---------------------------------------------------------------------------
// Trafik pengunjung
// ---------------------------------------------------------------------------

export type TrafficDay = { day: string; views: number; visitors: number };
export type TrafficPage = { path: string; title: string | null; views: number };
export type Traffic = {
  days: TrafficDay[];
  today: { views: number; visitors: number };
  week: { views: number; visitors: number };
  month: { views: number; visitors: number };
  pages: TrafficPage[];
};

const WIB_TODAY = "(now() AT TIME ZONE 'Asia/Jakarta')::date";

/** Kunjungan per hari selama `span` hari terakhir (7 sampai 90), ringkasannya, dan halaman teramai. */
export async function getTraffic(span = 30): Promise<Traffic> {
  const length = Math.min(90, Math.max(7, Math.trunc(span)));
  const [days, pages] = await Promise.all([
    query<TrafficDay>(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
              COALESCE((SELECT sum(views) FROM page_views v WHERE v.day = d.day), 0)::int AS views,
              (SELECT count(*) FROM visitors u WHERE u.day = d.day)::int AS visitors
         FROM generate_series(${WIB_TODAY} - ($1::int - 1), ${WIB_TODAY}, interval '1 day') AS d(day)
        ORDER BY d.day`,
      [length],
    ),
    query<TrafficPage>(
      `SELECT v.path, max(p.title) AS title, sum(v.views)::int AS views
         FROM page_views v
         LEFT JOIN posts p ON v.path = '/berita/' || p.slug
        WHERE v.day > ${WIB_TODAY} - $1::int
        GROUP BY v.path
        ORDER BY views DESC, v.path
        LIMIT 10`,
      [length],
    ),
  ]);
  const total = (rows: TrafficDay[]) => ({
    views: rows.reduce((sum, row) => sum + row.views, 0),
    visitors: rows.reduce((sum, row) => sum + row.visitors, 0),
  });
  return {
    days,
    today: total(days.slice(-1)),
    week: total(days.slice(-7)),
    month: total(days),
    pages,
  };
}

// ---------------------------------------------------------------------------
// Pratinjau draf dan riwayat versi artikel
// ---------------------------------------------------------------------------

/** Artikel apa pun statusnya, dicari lewat kunci pratinjau. */
export async function getPostByPreviewToken(token: string): Promise<Post | null> {
  if (!/^[a-z0-9]{16,40}$/.test(token)) return null;
  return one<Post>(`${postSelect(true)} WHERE p.preview_token = $1`, [token]);
}

export async function listPostRevisions(postId: number): Promise<PostRevision[]> {
  return query<PostRevision>(
    `SELECT id, post_id, user_name, title, summary, created_at
       FROM post_revisions WHERE post_id = $1 ORDER BY id DESC LIMIT 20`,
    [postId],
  );
}

// ---------------------------------------------------------------------------
// Kotak masuk
// ---------------------------------------------------------------------------

/** Isi pengajuan disimpan sebagai JSON; sebagian driver mengembalikannya sebagai teks. */
function withPayload(message: Message): Message {
  if (typeof message.payload !== "string") return { ...message, payload: message.payload ?? {} };
  try {
    return { ...message, payload: JSON.parse(message.payload) };
  } catch {
    return { ...message, payload: {} };
  }
}

export async function listMessages(filter: { kind?: MessageKind; status?: MessageStatus }): Promise<Message[]> {
  const params: unknown[] = [];
  const where: string[] = [];
  if (filter.kind) {
    params.push(filter.kind);
    where.push(`kind = $${params.length}`);
  }
  if (filter.status) {
    params.push(filter.status);
    where.push(`status = $${params.length}`);
  }
  const rows = await query<Message>(
    `SELECT id, kind, name, email, phone, subject, body, payload, status, event_id, handled_by, created_at
       FROM messages ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY (status = 'baru') DESC, id DESC LIMIT 200`,
    params,
  );
  return rows.map(withPayload);
}

export async function getMessageById(id: number): Promise<Message | null> {
  const row = await one<Message>(
    `SELECT id, kind, name, email, phone, subject, body, payload, status, event_id, handled_by, created_at
       FROM messages WHERE id = $1`,
    [id],
  );
  return row ? withPayload(row) : null;
}

export type MessageCounts = { total: number; baru: number; event: number; iklan: number; pesan: number };

export async function countMessages(): Promise<MessageCounts> {
  const row = await one<MessageCounts>(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE status = 'baru')::int AS baru,
            count(*) FILTER (WHERE kind = 'event')::int AS event,
            count(*) FILTER (WHERE kind = 'iklan')::int AS iklan,
            count(*) FILTER (WHERE kind = 'pesan')::int AS pesan
       FROM messages`,
  );
  return row ?? { total: 0, baru: 0, event: 0, iklan: 0, pesan: 0 };
}

// ---------------------------------------------------------------------------
// Halaman statis, buletin, riwayat
// ---------------------------------------------------------------------------

const PAGE_SELECT = "SELECT id, title, slug, body, status, in_footer, updated_at FROM pages";

export async function listPages(): Promise<Page[]> {
  return query<Page>(`${PAGE_SELECT} ORDER BY title`);
}

export async function listFooterPages(): Promise<Page[]> {
  return query<Page>(`${PAGE_SELECT} WHERE status = 'published' AND in_footer ORDER BY title`);
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  return one<Page>(`${PAGE_SELECT} WHERE slug = $1 AND status = 'published'`, [slug]);
}

export async function getPageById(id: number): Promise<Page | null> {
  return one<Page>(`${PAGE_SELECT} WHERE id = $1`, [id]);
}

export async function listSubscribers(): Promise<Subscriber[]> {
  return query<Subscriber>("SELECT id, email, created_at FROM subscribers ORDER BY id DESC LIMIT 5000");
}

export async function listActivity(limit = 200): Promise<Activity[]> {
  return query<Activity>(
    "SELECT id, user_name, action, href, created_at FROM activity ORDER BY id DESC LIMIT $1",
    [limit],
  );
}
