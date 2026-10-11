import Link from "next/link";
import { deleteEvent, saveEvent } from "@/lib/actions/events";
import { toInputValue } from "@/lib/format";
import type { EventItem, EventType } from "@/lib/types";
import { ConfirmButton } from "./ConfirmButton";
import { Editor } from "./Editor";
import { MediaPicker, type PickerItem } from "./MediaPicker";
import { SubmitButton } from "./SubmitButton";
import { Field, StatusField } from "./ui";

export function EventForm({
  event,
  types,
  media,
}: {
  event: EventItem | null;
  types: EventType[];
  media: PickerItem[];
}) {
  return (
    <>
      <form action={saveEvent} className="form">
        {event && <input type="hidden" name="id" value={event.id} />}

        <div className="form-main">
          <Field label="Nama event" htmlFor="title">
            <input
              id="title"
              name="title"
              type="text"
              className="input-title"
              defaultValue={event?.title ?? ""}
              maxLength={200}
              required
              autoFocus={!event}
            />
          </Field>
          <Field label="Ringkasan" htmlFor="summary" hint="Satu kalimat yang tampil di bawah judul. Bila kosong, diambil dari deskripsi.">
            <textarea id="summary" name="summary" rows={2} maxLength={300} defaultValue={event?.summary ?? ""} />
          </Field>

          <div className="field-row">
            <Field label="Mulai (WIB)" htmlFor="starts_at">
              <input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                defaultValue={toInputValue(event?.starts_at ?? null)}
                required
              />
            </Field>
            <Field label="Selesai (WIB)" htmlFor="ends_at" hint="Boleh kosong.">
              <input
                id="ends_at"
                name="ends_at"
                type="datetime-local"
                defaultValue={toInputValue(event?.ends_at ?? null)}
              />
            </Field>
          </div>
          <label className="check">
            <input type="checkbox" name="all_day" defaultChecked={event?.all_day ?? false} />
            <span>Sepanjang hari (jam tidak ditampilkan)</span>
          </label>

          <div className="field-row">
            <Field label="Nama tempat" htmlFor="venue_name">
              <input id="venue_name" name="venue_name" type="text" defaultValue={event?.venue_name ?? ""} maxLength={160} />
            </Field>
            <Field label="Kota" htmlFor="city">
              <input id="city" name="city" type="text" defaultValue={event?.city ?? ""} maxLength={80} />
            </Field>
          </div>
          <Field label="Alamat" htmlFor="address" hint="Dipakai untuk tautan peta.">
            <input id="address" name="address" type="text" defaultValue={event?.address ?? ""} maxLength={300} />
          </Field>

          <div className="field-row">
            <Field label="Harga tiket" htmlFor="price_info" hint="Contoh: Rp175.000 atau Gratis.">
              <input id="price_info" name="price_info" type="text" defaultValue={event?.price_info ?? ""} maxLength={200} />
            </Field>
            <Field label="Penyelenggara" htmlFor="organizer_name">
              <input
                id="organizer_name"
                name="organizer_name"
                type="text"
                defaultValue={event?.organizer_name ?? ""}
                maxLength={160}
              />
            </Field>
          </div>
          <Field label="Tautan tiket atau info resmi" htmlFor="ticket_url">
            <input
              id="ticket_url"
              name="ticket_url"
              type="text"
              inputMode="url"
              defaultValue={event?.ticket_url ?? ""}
              placeholder="https://…"
              maxLength={500}
            />
          </Field>

          <Field label="Deskripsi" htmlFor="description">
            <Editor name="description" defaultValue={event?.description ?? ""} rows={10} />
          </Field>
        </div>

        <aside className="form-side">
          <StatusField value={event?.status ?? "published"} />
          <Field label="Tipe event" htmlFor="type_id">
            <select id="type_id" name="type_id" defaultValue={event?.type_id ?? ""}>
              <option value="">Tanpa tipe</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Gambar sampul" htmlFor="cover_url" hint="Tanpa gambar, situs memakai sampul bawaan.">
            <MediaPicker name="cover_url" defaultValue={event?.cover_url ?? ""} items={media} />
          </Field>
          <Field label="Alamat (slug)" htmlFor="slug" hint="Kosongkan agar dibuat dari nama event.">
            <input id="slug" name="slug" type="text" defaultValue={event?.slug ?? ""} maxLength={120} />
          </Field>

          <div className="form-actions">
            <SubmitButton />
            <Link href="/admin/event" className="btn btn--line">
              Batal
            </Link>
          </div>
        </aside>
      </form>

      {event && (
        <form action={deleteEvent} className="form-danger">
          <input type="hidden" name="id" value={event.id} />
          <ConfirmButton label="Hapus event ini" message={`Hapus event "${event.title}"? Tindakan ini tidak bisa dibatalkan.`} />
        </form>
      )}
    </>
  );
}
