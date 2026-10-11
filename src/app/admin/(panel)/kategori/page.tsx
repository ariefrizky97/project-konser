import type { Metadata } from "next";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Flash } from "@/components/admin/Flash";
import { PageHead } from "@/components/admin/ui";
import { deleteTaxonomy, refreshYoutube, saveTaxonomy } from "@/lib/actions/taxonomy";
import { YoutubePicker } from "@/components/admin/YoutubePicker";
import { getSettings } from "@/lib/settings";
import { categoryYoutube, channelPlaylists, hasAutoYoutube, type ChannelPlaylists, type YtVia } from "@/lib/ytlist";
import { requireUser } from "@/lib/auth";
import { listCategoriesWithCount, listEventTypes } from "@/lib/queries";

export const metadata: Metadata = { title: "Kategori" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

type YtCheck = { count: number; via: YtVia; error: string; first: string[]; durations: boolean; playlist: boolean; auto: boolean };
type Item = { id: number; name: string; slug?: string; sort: number; color: string; note?: string; youtube?: string; youtube_title?: string; yt?: YtCheck | null };

const DEFAULT_COLOR = "#f2c230";

/** Hasil pengambilan data YouTube untuk isian kategori ini. */
function YoutubeCheck({ check }: { check: YtCheck }) {
  const ok = check.via !== "gagal";
  return (
    <div className={`yt-check${ok ? " is-ok" : " is-bad"}`} role="status">
      <strong>
        {ok
          ? `${check.count} video terambil${check.auto ? " otomatis" : ""} lewat ${check.via === "api" ? "YouTube Data API" : "RSS YouTube"}`
          : "Daftar video tidak bisa diambil"}
      </strong>
      <span>
        {ok
          ? check.durations
            ? "Judul, tanggal, dan durasi tampil di beranda."
            : "Judul dan tanggal tampil; durasi butuh YOUTUBE_API_KEY yang aktif."
          : check.playlist
            ? "Pemutar playlist bawaan YouTube tetap tampil di beranda."
            : "Video tetap tampil dengan gambar pratinjau, tanpa judul."}
      </span>
      {check.error && <span className="yt-check-error">{check.error}</span>}
      {check.first.length > 0 && (
        <ol className="yt-check-list">
          {check.first.map((title, index) => (
            <li key={index}>{title}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Isian YouTube untuk blok kategori di beranda. Ikut terkirim bersama form baris kategorinya. */
function YoutubeFields({ item, form, channel }: { item: Item; form: string; channel: ChannelPlaylists | null }) {
  const value = item.youtube?.trim() ?? "";
  const auto = hasAutoYoutube(item.slug ?? "");
  const off = value.toLowerCase() === "mati";
  const badge = off ? "Mati" : value ? "Terisi" : auto ? "Otomatis" : "Kosong";
  const filled = Boolean(value) && !off;
  return (
    <details className="tax-yt">
      <summary>
        <span className="tax-yt-icon" aria-hidden="true">▶</span>
        Video YouTube di beranda
        <span className={filled || badge === "Otomatis" ? "badge badge--ok" : "badge"}>{badge}</span>
      </summary>
      <div className="tax-yt-body">
        {item.yt && <YoutubeCheck check={item.yt} />}
        <div className="field">
          <label className="field-label" htmlFor={`yt-title-${item.id}`}>
            Judul daftar video
          </label>
          <input
            id={`yt-title-${item.id}`}
            form={form}
            name="youtube_title"
            type="text"
            maxLength={80}
            defaultValue={item.youtube_title ?? ""}
            placeholder={`Misalnya "${item.name} Week 31" atau "Trailer"`}
          />
        </div>
        <div className="field">
          <span className="field-label">Sumber video</span>
          <YoutubePicker
            form={form}
            value={item.youtube ?? ""}
            auto={auto}
            autoLabel={item.slug === "musik" ? "Video musik terpopuler di Indonesia, diperbarui otomatis" : "Trailer film Indonesia terbaru, diperbarui otomatis"}
            playlists={channel?.playlists ?? []}
            channel={channel?.channel || channel?.handle || ""}
            channelError={channel?.error ?? ""}
          />
        </div>
        <div className="tax-yt-save">
          <button type="submit" form={form} className="btn btn--sm">
            Simpan video
          </button>
        </div>
      </div>
    </details>
  );
}

function TaxonomyPanel({
  title,
  table,
  items,
  addLabel,
  channel,
}: {
  title: string;
  table: "categories" | "event_types";
  items: Item[];
  addLabel: string;
  channel?: ChannelPlaylists | null;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
      </div>
      <ul className="tax">
        {items.map((item) => (
          <li key={item.id}>
            <form action={saveTaxonomy} className="tax-form" id={`${table}-form-${item.id}`}>
              <input type="hidden" name="table" value={table} />
              <input type="hidden" name="id" value={item.id} />
              <label className="sr" htmlFor={`${table}-name-${item.id}`}>
                Nama
              </label>
              <input id={`${table}-name-${item.id}`} name="name" type="text" defaultValue={item.name} maxLength={80} required />
              <label className="sr" htmlFor={`${table}-sort-${item.id}`}>
                Urutan
              </label>
              <input
                id={`${table}-sort-${item.id}`}
                name="sort"
                type="number"
                className="tax-sort"
                defaultValue={item.sort}
                title="Urutan tampil"
              />
              <label className="sr" htmlFor={`${table}-color-${item.id}`}>
                Warna label
              </label>
              <input
                id={`${table}-color-${item.id}`}
                name="color"
                type="color"
                className="tax-color"
                defaultValue={item.color || DEFAULT_COLOR}
                title="Warna label"
              />
              <button type="submit" className="link">
                Simpan
              </button>
            </form>
            {item.note && <span className="tax-note">{item.note}</span>}
            <form action={deleteTaxonomy}>
              <input type="hidden" name="table" value={table} />
              <input type="hidden" name="id" value={item.id} />
              <ConfirmButton
                label="Hapus"
                message={`Hapus "${item.name}"? Konten yang memakainya tidak ikut terhapus, hanya kehilangan labelnya.`}
              />
            </form>
            {table === "categories" && <YoutubeFields item={item} form={`${table}-form-${item.id}`} channel={channel ?? null} />}
          </li>
        ))}
      </ul>
      <form action={saveTaxonomy} className="tax-form tax-form--add">
        <input type="hidden" name="table" value={table} />
        <label className="sr" htmlFor={`${table}-new`}>
          {addLabel}
        </label>
        <input id={`${table}-new`} name="name" type="text" placeholder={addLabel} maxLength={80} required />
        <label className="sr" htmlFor={`${table}-new-color`}>
          Warna label
        </label>
        <input id={`${table}-new-color`} name="color" type="color" className="tax-color" defaultValue={DEFAULT_COLOR} title="Warna label" />
        <input type="hidden" name="sort" value={items.length + 1} />
        <button type="submit" className="chip">
          Tambah
        </button>
      </form>
    </section>
  );
}

export default async function TaxonomyPage({ searchParams }: Props) {
  await requireUser();
  const [query, categories, types] = await Promise.all([
    searchParams,
    listCategoriesWithCount(),
    listEventTypes(),
  ]);
  // Periksa langsung isian YouTube tiap kategori: berapa video terambil dan lewat jalur apa.
  const checks = await Promise.all(
    categories.map(async (category): Promise<YtCheck | null> => {
      const status = await categoryYoutube(category);
      if (!category.youtube.trim() && !status.list && !status.error) return null;
      const videos = status.list?.videos ?? [];
      return {
        count: videos.length,
        via: status.via,
        error: status.error,
        first: videos.slice(0, 3).map((video) => `${video.title}${video.duration ? ` (${video.duration})` : ""}`),
        durations: videos.some((video) => Boolean(video.duration)),
        playlist: Boolean(status.list?.playlist),
        auto: status.auto,
      };
    }),
  );
  const apiKey = Boolean(process.env.YOUTUBE_API_KEY?.trim());
  // Playlist di kanal YouTube situs (alamat dari Pengaturan), untuk dipilih langsung.
  const channel = await channelPlaylists((await getSettings()).youtube);

  return (
    <>
      <PageHead
        title="Kategori"
        description="Kategori mengelompokkan berita; tipe mengelompokkan event. Angka menentukan urutan tampil, dan kotak warna menentukan warna label kategori itu di situs. Tiap kategori tampil sebagai blok di beranda, lengkap dengan video YouTube bila diisi."
      />
      <Flash query={query} />
      <div className="yt-key">
        <span className={apiKey ? "badge badge--ok" : "badge"}>{apiKey ? "YOUTUBE_API_KEY terpasang" : "Tanpa YOUTUBE_API_KEY"}</span>
        <span>
          {apiKey
            ? "Video YouTube di beranda diambil lewat YouTube Data API (dengan durasi), disimpan satu jam."
            : "Video YouTube diambil lewat RSS (tanpa durasi). Isi YOUTUBE_API_KEY di .env untuk menampilkan durasi."}
        </span>
        <form action={refreshYoutube}>
          <button type="submit" className="chip">
            Ambil ulang dari YouTube
          </button>
        </form>
      </div>
      <div className="adm-cols">
        <TaxonomyPanel
          title="Kategori berita"
          table="categories"
          addLabel="Nama kategori baru"
          items={categories.map((item, index) => ({ ...item, note: `${item.post_count} artikel`, yt: checks[index] }))}
          channel={channel}
        />
        <TaxonomyPanel title="Tipe event" table="event_types" addLabel="Nama tipe baru" items={types} />
      </div>
    </>
  );
}
