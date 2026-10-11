import Link from "next/link";
import { deletePost, makePreviewLink, restoreRevision, savePost } from "@/lib/actions/posts";
import { relativeTime, toInputValue } from "@/lib/format";
import type { Category, Post, PostRevision, Role } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { SeoFields } from "./SeoFields";
import { ConfirmButton } from "./ConfirmButton";
import { Editor } from "./Editor";
import { MediaPicker, type PickerItem } from "./MediaPicker";
import { SubmitButton } from "./SubmitButton";
import { TagInput } from "./TagInput";
import { Field, StatusField } from "./ui";
import { VideoField } from "./VideoField";

export function PostForm({
  post,
  categories,
  media,
  tags,
  tagSuggestions,
  revisions = [],
  role = "admin",
  siteName = "",
  siteUrl = "",
}: {
  post: Post | null;
  categories: Category[];
  media: PickerItem[];
  /** Tagar artikel ini saat ini. */
  tags: string[];
  /** Tagar yang sudah pernah dipakai, sebagai saran. */
  tagSuggestions: string[];
  /** Versi lama artikel ini, terbaru dulu. */
  revisions?: PostRevision[];
  /** Peran pengguna yang sedang masuk: penulis tidak bisa menerbitkan sendiri. */
  role?: Role;
  siteName?: string;
  /** Alamat situs lengkap, untuk tautan pratinjau. */
  siteUrl?: string;
}) {
  return (
    <>
      <form action={savePost} className="form">
        {post && <input type="hidden" name="id" value={post.id} />}

        <div className="form-main">
          <Field label="Judul" htmlFor="title">
            <input
              id="title"
              name="title"
              type="text"
              className="input-title"
              defaultValue={post?.title ?? ""}
              maxLength={200}
              required
              autoFocus={!post}
            />
          </Field>
          <Field
            label="Ringkasan"
            htmlFor="excerpt"
            hint="Satu atau dua kalimat. Tampil di kartu artikel dan hasil pencarian. Bila kosong, diambil dari awal isi."
          >
            <textarea id="excerpt" name="excerpt" rows={2} maxLength={300} defaultValue={post?.excerpt ?? ""} />
          </Field>
          <Field label="Isi" htmlFor="body">
            <Editor name="body" defaultValue={post?.body ?? ""} />
          </Field>
          <Field
            label="Tagar"
            htmlFor="tags"
            hint="Tekan Enter, koma, atau spasi setelah tiap tagar. Paling banyak 12. Tagar tampil di bawah artikel dan bisa diklik pembaca."
          >
            <TagInput name="tags" defaultValue={tags} suggestions={tagSuggestions} />
          </Field>
          <details className="panel seo-panel" open={Boolean(post?.seo_title || post?.seo_description)}>
            <summary>Mesin pencari dan media sosial</summary>
            <SeoFields
              defaultTitle={post?.seo_title ?? ""}
              defaultDescription={post?.seo_description ?? ""}
              siteName={siteName}
              host={siteUrl.replace(/^https?:\/\//, "")}
            />
          </details>
        </div>

        <aside className="form-side">
          <fieldset className="field">
            <legend className="field-label">Status</legend>
            <div className="seg seg--three">
              <label>
                <input type="radio" name="status" value="draft" defaultChecked={(post?.status ?? "draft") === "draft"} />
                <span>Draf</span>
              </label>
              <label>
                <input type="radio" name="status" value="review" defaultChecked={post?.status === "review"} />
                <span>Tinjau</span>
              </label>
              <label>
                <input type="radio" name="status" value="published" defaultChecked={post?.status === "published"} />
                <span>Terbit</span>
              </label>
            </div>
            <p className="field-hint">
              {role === "admin"
                ? "Tinjau berarti menunggu diperiksa sebelum terbit."
                : "Anda masuk sebagai penulis: pilihan Terbit akan diajukan ke admin untuk ditinjau."}
            </p>
          </fieldset>
          <Field label="Catatan untuk peninjau" htmlFor="review_note" hint="Hanya terlihat di admin.">
            <textarea id="review_note" name="review_note" rows={2} maxLength={500} defaultValue={post?.review_note ?? ""} />
          </Field>
          <Field
            label="Waktu terbit (WIB)"
            htmlFor="published_at"
            hint="Waktu ini tampil di artikel (Terbit … lalu, tanggal, jam). Kosongkan untuk terbit saat disimpan, isi waktu di masa depan untuk menjadwalkan, atau isi waktu lampau untuk memundurkan tanggal."
          >
            <input
              id="published_at"
              name="published_at"
              type="datetime-local"
              defaultValue={toInputValue(post?.published_at ?? null)}
            />
          </Field>
          <Field label="Kategori" htmlFor="category_id">
            <select id="category_id" name="category_id" defaultValue={post?.category_id ?? ""}>
              <option value="">Tanpa kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <label className="check">
            <input type="checkbox" name="featured" defaultChecked={post?.featured ?? false} />
            <span>Jadikan artikel utama di beranda</span>
          </label>
          <Field label="Gambar sampul" htmlFor="cover_url" hint="Thumbnail artikel di kartu dan beranda. Tanpa gambar, dipakai gambar video YouTube (bila ada) atau sampul bawaan.">
            <MediaPicker name="cover_url" defaultValue={post?.cover_url ?? ""} items={media} />
          </Field>
          <Field
            label="Video YouTube"
            htmlFor="video_url"
            hint="Tempel tautan YouTube. Video tampil di atas isi artikel. Tanpa gambar sampul, gambar video ini dipakai sebagai thumbnail di kartu."
          >
            <VideoField name="video_url" defaultValue={post?.video_url ?? ""} />
          </Field>
          <Field label="Alamat (slug)" htmlFor="slug" hint="Kosongkan agar dibuat dari judul.">
            <input id="slug" name="slug" type="text" defaultValue={post?.slug ?? ""} maxLength={120} />
          </Field>

          <div className="form-actions">
            <SubmitButton />
            <Link href="/admin/berita" className="btn btn--line">
              Batal
            </Link>
          </div>
        </aside>
      </form>

      {post && (
        <div className="adm-cols post-extra">
          <section className="panel">
            <div className="panel-head">
              <h2>Tautan pratinjau draf</h2>
            </div>
            {post.preview_token ? (
              <>
                <p className="preview-link">
                  <a href={`/pratinjau/${post.preview_token}`} target="_blank" rel="noreferrer">
                    {siteUrl}/pratinjau/{post.preview_token}
                  </a>
                </p>
                <p className="field-hint">
                  Siapa pun yang memegang tautan ini bisa melihat artikel persis seperti tampilan publiknya, juga
                  selagi masih draf. Simpan dulu perubahan terakhir supaya ikut terlihat.
                </p>
                <div className="picker-actions">
                  <CopyButton text={`${siteUrl}/pratinjau/${post.preview_token}`} label="Salin tautan" />
                  <form action={makePreviewLink}>
                    <input type="hidden" name="id" value={post.id} />
                    <button type="submit" className="chip">
                      Buat ulang
                    </button>
                  </form>
                  <form action={makePreviewLink}>
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="hapus" value="1" />
                    <button type="submit" className="chip">
                      Matikan tautan
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <>
                <p className="field-hint">
                  Buat tautan rahasia untuk memperlihatkan draf ini ke narasumber atau rekan sebelum terbit.
                </p>
                <form action={makePreviewLink}>
                  <input type="hidden" name="id" value={post.id} />
                  <button type="submit" className="chip">
                    Buat tautan pratinjau
                  </button>
                </form>
              </>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Riwayat perubahan</h2>
            </div>
            {revisions.length === 0 ? (
              <p className="field-hint">
                Belum ada versi lama. Setiap kali judul, ringkasan, atau isi diubah lalu disimpan, versi sebelumnya
                dicatat di sini (20 terakhir).
              </p>
            ) : (
              <ol className="revisions">
                {revisions.map((revision) => (
                  <li key={revision.id}>
                    <span className="revisions-text">
                      <strong>{revision.user_name || "Seseorang"}</strong> {revision.summary}
                      <small>
                        Versi sebelum perubahan itu: "{revision.title}" · {relativeTime(revision.created_at)}
                      </small>
                    </span>
                    <form action={restoreRevision}>
                      <input type="hidden" name="revision_id" value={revision.id} />
                      <ConfirmButton
                        label="Kembalikan"
                        className="link"
                        message="Kembalikan judul, ringkasan, dan isi ke versi ini? Versi yang sekarang tetap tersimpan di riwayat."
                      />
                    </form>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}

      {post && (
        <form action={deletePost} className="form-danger">
          <input type="hidden" name="id" value={post.id} />
          <ConfirmButton label="Hapus artikel ini" message={`Hapus artikel "${post.title}"? Tindakan ini tidak bisa dibatalkan.`} />
        </form>
      )}
    </>
  );
}
