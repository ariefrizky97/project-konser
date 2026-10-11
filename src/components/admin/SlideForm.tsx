import Link from "next/link";
import { deleteSlide, saveSlide } from "@/lib/actions/slides";
import { SLIDE_KINDS, SLIDE_KIND_LABELS, type Slide } from "@/lib/types";
import { ConfirmButton } from "./ConfirmButton";
import { MediaPicker, type PickerItem } from "./MediaPicker";
import { SubmitButton } from "./SubmitButton";
import { VideoField } from "./VideoField";
import { Field } from "./ui";

export function SlideForm({
  slide,
  media,
  nextSort,
}: {
  slide: Slide | null;
  media: PickerItem[];
  /** Urutan bawaan untuk slide baru: di belakang slide yang sudah ada. */
  nextSort: number;
}) {
  const kind = slide?.kind ?? "photo";
  return (
    <>
      <form action={saveSlide} className="form">
        {slide && <input type="hidden" name="id" value={slide.id} />}

        <div className="form-main">
          <fieldset className="field">
            <legend className="field-label">Jenis slide</legend>
            <div className="seg">
              {SLIDE_KINDS.map((item) => (
                <label key={item}>
                  <input type="radio" name="kind" value={item} defaultChecked={item === kind} />
                  <span>{SLIDE_KIND_LABELS[item]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Judul" htmlFor="title">
            <input
              id="title"
              name="title"
              type="text"
              className="input-title"
              defaultValue={slide?.title ?? ""}
              maxLength={120}
              required
              autoFocus={!slide}
            />
          </Field>
          <Field label="Keterangan" htmlFor="caption" hint="Satu kalimat di bawah judul. Boleh kosong.">
            <input id="caption" name="caption" type="text" defaultValue={slide?.caption ?? ""} maxLength={200} />
          </Field>
          <Field
            label="Gambar (untuk slide foto)"
            htmlFor="image_url"
            hint="Ukuran yang pas: 1600 × 900 px. Tanpa gambar, slide memakai sampul bawaan."
          >
            <MediaPicker name="image_url" defaultValue={slide?.image_url ?? ""} items={media} />
          </Field>
          <Field
            label="Tautan YouTube (untuk slide video)"
            htmlFor="video_url"
            hint="Wajib untuk slide video. Pengunjung menekan tombol putar untuk menonton di tempat."
          >
            <VideoField name="video_url" defaultValue={slide?.video_url ?? ""} />
          </Field>
          <Field
            label="Tautan tujuan"
            htmlFor="link_url"
            hint="Dibuka lewat tombol Lihat selengkapnya, misalnya /berita/… atau /event/…. Boleh kosong."
          >
            <input
              id="link_url"
              name="link_url"
              type="text"
              inputMode="url"
              defaultValue={slide?.link_url ?? ""}
              placeholder="/event/…"
              maxLength={500}
            />
          </Field>
        </div>

        <aside className="form-side">
          <label className="check">
            <input type="checkbox" name="active" defaultChecked={slide?.active ?? true} />
            <span>Tampilkan di beranda</span>
          </label>
          <Field label="Urutan" htmlFor="sort" hint="Angka kecil tampil lebih dulu.">
            <input id="sort" name="sort" type="number" defaultValue={slide?.sort ?? nextSort} />
          </Field>
          <div className="form-actions">
            <SubmitButton />
            <Link href="/admin/slide" className="btn btn--line">
              Batal
            </Link>
          </div>
        </aside>
      </form>

      {slide && (
        <form action={deleteSlide} className="form-danger">
          <input type="hidden" name="id" value={slide.id} />
          <ConfirmButton label="Hapus slide ini" message={`Hapus slide "${slide.title}"? Tindakan ini tidak bisa dibatalkan.`} />
        </form>
      )}
    </>
  );
}
