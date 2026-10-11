export type Role = "admin" | "editor";
export type Status = "draft" | "published";
/** Artikel punya satu status tambahan: menunggu tinjauan admin. */
export type PostStatus = Status | "review";

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  /** Foto profil. Kosong berarti memakai inisial nama. */
  avatar_url: string;
  /** Posisi dan perbesaran foto profil, "x,y,zoom". Kosong berarti tengah tanpa perbesaran. */
  avatar_crop: string;
  created_at: Date;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  sort: number;
  /** Warna label, heksadesimal. Kosong berarti memakai warna bawaan. */
  color: string;
  /** Tautan playlist/kanal YouTube, atau tautan video satu per baris, untuk blok kategori di beranda. */
  youtube: string;
  /** Judul daftar video di beranda. Kosong berarti memakai judul playlist dari YouTube. */
  youtube_title: string;
};

export type CategoryWithCount = Category & { post_count: number };

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_url: string | null;
  video_url: string;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  category_color: string | null;
  author_id: number | null;
  author_name: string | null;
  author_avatar: string | null;
  author_avatar_crop: string | null;
  status: PostStatus;
  featured: boolean;
  views: number;
  /** Judul dan deskripsi khusus mesin pencari. Kosong berarti memakai judul dan ringkasan. */
  seo_title: string;
  seo_description: string;
  /** Kunci tautan pratinjau draf. Kosong berarti belum dibuat. */
  preview_token: string;
  review_note: string;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type EventType = {
  id: number;
  name: string;
  slug: string;
  sort: number;
  color: string;
};

export type EventItem = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  description: string;
  cover_url: string | null;
  type_id: number | null;
  type_name: string | null;
  type_slug: string | null;
  type_color: string | null;
  starts_at: Date;
  ends_at: Date | null;
  all_day: boolean;
  venue_name: string;
  city: string;
  address: string;
  price_info: string;
  ticket_url: string;
  organizer_name: string;
  status: Status;
  created_at: Date;
  updated_at: Date;
};

export const DIRECTORY_KINDS = ["venue", "artis", "organizer", "komunitas", "vendor"] as const;
export type DirectoryKind = (typeof DIRECTORY_KINDS)[number];

export const DIRECTORY_LABELS: Record<DirectoryKind, string> = {
  venue: "Venue",
  artis: "Artis",
  organizer: "Organizer",
  komunitas: "Komunitas",
  vendor: "Vendor",
};

export type DirectoryEntry = {
  id: number;
  kind: DirectoryKind;
  name: string;
  slug: string;
  summary: string;
  description: string;
  city: string;
  address: string;
  contact: string;
  website: string;
  instagram: string;
  cover_url: string | null;
  status: Status;
  created_at: Date;
  updated_at: Date;
};

export const AD_SLOTS = ["header", "inline"] as const;
export type AdSlotName = (typeof AD_SLOTS)[number];
export const AD_SLOT_LABELS: Record<AdSlotName, string> = {
  header: "Header (lebar penuh, 970 × 220)",
  inline: "Sela konten (lebar penuh)",
};

export const AD_TEMPLATES = ["image", "text", "split"] as const;
export type AdTemplate = (typeof AD_TEMPLATES)[number];
export const AD_TEMPLATE_LABELS: Record<AdTemplate, string> = {
  image: "Banner gambar",
  text: "Teks dan tombol",
  split: "Gambar dan teks",
};

export const AD_TONES = ["sun", "ink", "plain"] as const;
export type AdTone = (typeof AD_TONES)[number];
export const AD_TONE_LABELS: Record<AdTone, string> = {
  sun: "Kuning",
  ink: "Gelap",
  plain: "Polos",
};

export type Ad = {
  id: number;
  name: string;
  slot: AdSlotName;
  template: AdTemplate;
  tone: AdTone;
  headline: string;
  subline: string;
  cta_label: string;
  image_url: string;
  target_url: string;
  active: boolean;
  starts_at: Date | null;
  ends_at: Date | null;
  clicks: number;
  created_at: Date;
  updated_at: Date;
};

/** Bagian iklan yang dibutuhkan untuk menggambar tampilannya. */
export type AdContent = Pick<
  Ad,
  "template" | "tone" | "headline" | "subline" | "cta_label" | "image_url"
>;

export type MediaItem = {
  id: number;
  filename: string;
  mime: string;
  bytes: number;
  url: string;
  thumbnail_url: string;
  file_id: string;
  width: number | null;
  height: number | null;
  created_at: Date;
};

export type Tag = {
  id: number;
  name: string;
  slug: string;
};

export type TagWithCount = Tag & { post_count: number };

export const SLIDE_KINDS = ["photo", "video"] as const;
export type SlideKind = (typeof SLIDE_KINDS)[number];
export const SLIDE_KIND_LABELS: Record<SlideKind, string> = {
  photo: "Foto",
  video: "Video",
};

export type Slide = {
  id: number;
  kind: SlideKind;
  title: string;
  caption: string;
  image_url: string;
  video_url: string;
  link_url: string;
  sort: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type Settings = {
  site_name: string;
  tagline: string;
  description: string;
  about: string;
  contact_email: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  threads: string;
  facebook: string;
};

export type PostRevision = {
  id: number;
  post_id: number;
  user_name: string;
  title: string;
  summary: string;
  created_at: Date;
};

export type MessageKind = "event" | "iklan" | "pesan";
export type MessageStatus = "baru" | "selesai" | "ditolak";

/** Isi form "Kirim event" yang disimpan bersama pesannya. */
export type EventSubmission = {
  title?: string;
  type_id?: number | null;
  starts_at?: string;
  ends_at?: string;
  venue_name?: string;
  city?: string;
  price_info?: string;
  ticket_url?: string;
  organizer_name?: string;
};

export type Message = {
  id: number;
  kind: MessageKind;
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
  payload: EventSubmission;
  status: MessageStatus;
  event_id: number | null;
  handled_by: string;
  created_at: Date;
};

export const MESSAGE_LABELS: Record<MessageKind, string> = {
  event: "Pengajuan event",
  iklan: "Pasang iklan",
  pesan: "Pesan",
};

export type Page = {
  id: number;
  title: string;
  slug: string;
  body: string;
  status: Status;
  in_footer: boolean;
  updated_at: Date;
};

export type Subscriber = { id: number; email: string; created_at: Date };

export type Activity = { id: number; user_name: string; action: string; href: string; created_at: Date };
