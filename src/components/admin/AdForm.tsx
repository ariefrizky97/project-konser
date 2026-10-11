import Link from "next/link";
import { deleteAd, saveAd } from "@/lib/actions/ads";
import { toInputValue } from "@/lib/format";
import {
  AD_SLOTS,
  AD_SLOT_LABELS,
  AD_TEMPLATES,
  AD_TEMPLATE_LABELS,
  AD_TONES,
  AD_TONE_LABELS,
  type Ad,
  type AdTemplate,
} from "@/lib/types";
import { AdPreview } from "./AdPreview";
import { ConfirmButton } from "./ConfirmButton";
import { MediaPicker, type PickerItem } from "./MediaPicker";
import { SubmitButton } from "./SubmitButton";
import { Field } from "./ui";

const TEMPLATE_HINTS: Record<AdTemplate, string> = {
  image: "Satu gambar memenuhi slot. Siapkan gambar 1940 × 440 px untuk header.",
  text: "Judul, satu baris keterangan, dan tombol. Tanpa gambar.",
  split: "Gambar kecil di kiri, judul dan tombol di kanan.",
};

export function AdForm({ ad, media }: { ad: Ad | null; media: PickerItem[] }) {
  const template = ad?.template ?? "text";
  const tone = ad?.tone ?? "sun";
  const slot = ad?.slot ?? "header";

  return (
    <>
      <form action={saveAd} className="form">
        {ad && <input type="hidden" name="id" value={ad.id} />}

        <div className="form-main">
          <AdPreview
            initial={{
              slot,
              template,
              tone,
              headline: ad?.headline ?? "",
              subline: ad?.subline ?? "",
              cta_label: ad?.cta_label ?? "",
              image_url: ad?.image_url ?? "",
            }}
          />

          <fieldset className="field">
            <legend className="field-label">Template</legend>
            <div className="tpl">
              {AD_TEMPLATES.map((item) => (
                <label key={item} className="tpl-item">
                  <input type="radio" name="template" value={item} defaultChecked={item === template} />
                  <span className={`tpl-art tpl-art--${item}`} aria-hidden="true">
                    <i />
                    <b />
                    <em />
                  </span>
                  <span className="tpl-name">{AD_TEMPLATE_LABELS[item]}</span>
                  <span className="tpl-hint">{TEMPLATE_HINTS[item]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Judul iklan" htmlFor="headline" hint="Wajib untuk template dengan teks. Di banner gambar dipakai sebagai teks alternatif.">
            <input id="headline" name="headline" type="text" defaultValue={ad?.headline ?? ""} maxLength={90} />
          </Field>
          <Field label="Keterangan" htmlFor="subline">
            <input id="subline" name="subline" type="text" defaultValue={ad?.subline ?? ""} maxLength={140} />
          </Field>
          <div className="field-row">
            <Field label="Tulisan tombol" htmlFor="cta_label" hint="Contoh: Beli tiket.">
              <input id="cta_label" name="cta_label" type="text" defaultValue={ad?.cta_label ?? ""} maxLength={30} />
            </Field>
            <Field label="Tautan tujuan" htmlFor="target_url" hint="Dibuka saat iklan diklik.">
              <input
                id="target_url"
                name="target_url"
                type="text"
                inputMode="url"
                defaultValue={ad?.target_url ?? ""}
                placeholder="https://…"
                maxLength={500}
              />
            </Field>
          </div>
          <Field label="Gambar" htmlFor="image_url" hint="Dipakai oleh template Banner gambar serta Gambar dan teks. Banner header: 1940 × 440 px (perbandingan 970 × 220).">
            <MediaPicker name="image_url" defaultValue={ad?.image_url ?? ""} items={media} />
          </Field>
        </div>

        <aside className="form-side">
          <Field label="Nama iklan" htmlFor="name" hint="Hanya terlihat di admin, misalnya nama pemasang.">
            <input id="name" name="name" type="text" defaultValue={ad?.name ?? ""} maxLength={120} required />
          </Field>
          <Field label="Slot" htmlFor="slot">
            <select id="slot" name="slot" defaultValue={slot}>
              {AD_SLOTS.map((item) => (
                <option key={item} value={item}>
                  {AD_SLOT_LABELS[item]}
                </option>
              ))}
            </select>
          </Field>
          <fieldset className="field">
            <legend className="field-label">Warna</legend>
            <div className="seg">
              {AD_TONES.map((item) => (
                <label key={item}>
                  <input type="radio" name="tone" value={item} defaultChecked={item === tone} />
                  <span>{AD_TONE_LABELS[item]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="check">
            <input type="checkbox" name="active" defaultChecked={ad?.active ?? true} />
            <span>Aktif</span>
          </label>
          <Field label="Mulai tayang (WIB)" htmlFor="starts_at" hint="Kosongkan untuk langsung tayang.">
            <input id="starts_at" name="starts_at" type="datetime-local" defaultValue={toInputValue(ad?.starts_at ?? null)} />
          </Field>
          <Field label="Selesai tayang (WIB)" htmlFor="ends_at" hint="Kosongkan untuk tayang tanpa batas.">
            <input id="ends_at" name="ends_at" type="datetime-local" defaultValue={toInputValue(ad?.ends_at ?? null)} />
          </Field>

          <div className="form-actions">
            <SubmitButton />
            <Link href="/admin/iklan" className="btn btn--line">
              Batal
            </Link>
          </div>
        </aside>
      </form>

      {ad && (
        <form action={deleteAd} className="form-danger">
          <input type="hidden" name="id" value={ad.id} />
          <ConfirmButton label="Hapus iklan ini" message={`Hapus iklan "${ad.name}"? Tindakan ini tidak bisa dibatalkan.`} />
        </form>
      )}
    </>
  );
}
