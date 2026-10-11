import Link from "next/link";
import { deleteDirectoryEntry, saveDirectoryEntry } from "@/lib/actions/directory";
import { DIRECTORY_KINDS, DIRECTORY_LABELS, type DirectoryEntry } from "@/lib/types";
import { ConfirmButton } from "./ConfirmButton";
import { Editor } from "./Editor";
import { MediaPicker, type PickerItem } from "./MediaPicker";
import { SubmitButton } from "./SubmitButton";
import { Field, StatusField } from "./ui";

export function DirectoryForm({ entry, media }: { entry: DirectoryEntry | null; media: PickerItem[] }) {
  return (
    <>
      <form action={saveDirectoryEntry} className="form">
        {entry && <input type="hidden" name="id" value={entry.id} />}

        <div className="form-main">
          <Field label="Nama" htmlFor="name">
            <input
              id="name"
              name="name"
              type="text"
              className="input-title"
              defaultValue={entry?.name ?? ""}
              maxLength={160}
              required
              autoFocus={!entry}
            />
          </Field>
          <Field label="Ringkasan" htmlFor="summary" hint="Satu kalimat yang tampil di daftar direktori.">
            <textarea id="summary" name="summary" rows={2} maxLength={300} defaultValue={entry?.summary ?? ""} />
          </Field>
          <div className="field-row">
            <Field label="Kota" htmlFor="city">
              <input id="city" name="city" type="text" defaultValue={entry?.city ?? ""} maxLength={80} />
            </Field>
            <Field label="Kontak" htmlFor="contact" hint="Email atau nomor telepon.">
              <input id="contact" name="contact" type="text" defaultValue={entry?.contact ?? ""} maxLength={160} />
            </Field>
          </div>
          <Field label="Alamat" htmlFor="address">
            <input id="address" name="address" type="text" defaultValue={entry?.address ?? ""} maxLength={300} />
          </Field>
          <div className="field-row">
            <Field label="Situs web" htmlFor="website">
              <input
                id="website"
                name="website"
                type="text"
                inputMode="url"
                defaultValue={entry?.website ?? ""}
                placeholder="https://…"
                maxLength={500}
              />
            </Field>
            <Field label="Instagram" htmlFor="instagram" hint="Nama akun saja, tanpa @.">
              <input id="instagram" name="instagram" type="text" defaultValue={entry?.instagram ?? ""} maxLength={80} />
            </Field>
          </div>
          <Field label="Deskripsi" htmlFor="description">
            <Editor name="description" defaultValue={entry?.description ?? ""} rows={10} />
          </Field>
        </div>

        <aside className="form-side">
          <StatusField value={entry?.status ?? "published"} />
          <Field label="Jenis" htmlFor="kind">
            <select id="kind" name="kind" defaultValue={entry?.kind ?? "venue"}>
              {DIRECTORY_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {DIRECTORY_LABELS[kind]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Gambar" htmlFor="cover_url" hint="Tanpa gambar, situs memakai sampul bawaan.">
            <MediaPicker name="cover_url" defaultValue={entry?.cover_url ?? ""} items={media} />
          </Field>
          <Field label="Alamat (slug)" htmlFor="slug" hint="Kosongkan agar dibuat dari nama.">
            <input id="slug" name="slug" type="text" defaultValue={entry?.slug ?? ""} maxLength={120} />
          </Field>

          <div className="form-actions">
            <SubmitButton />
            <Link href="/admin/direktori" className="btn btn--line">
              Batal
            </Link>
          </div>
        </aside>
      </form>

      {entry && (
        <form action={deleteDirectoryEntry} className="form-danger">
          <input type="hidden" name="id" value={entry.id} />
          <ConfirmButton label="Hapus entri ini" message={`Hapus "${entry.name}" dari direktori? Tindakan ini tidak bisa dibatalkan.`} />
        </form>
      )}
    </>
  );
}
