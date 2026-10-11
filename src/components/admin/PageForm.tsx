import Link from "next/link";
import { deletePage, savePage } from "@/lib/actions/pages";
import type { Page } from "@/lib/types";
import { ConfirmButton } from "./ConfirmButton";
import { Editor } from "./Editor";
import { SubmitButton } from "./SubmitButton";
import { Field, StatusField } from "./ui";

export function PageForm({ page }: { page: Page | null }) {
  return (
    <>
      <form action={savePage} className="form">
        {page && <input type="hidden" name="id" value={page.id} />}
        <div className="form-main">
          <Field label="Judul" htmlFor="title">
            <input id="title" name="title" type="text" className="input-title" defaultValue={page?.title ?? ""} maxLength={160} required autoFocus={!page} />
          </Field>
          <Field label="Isi" htmlFor="body">
            <Editor name="body" defaultValue={page?.body ?? ""} />
          </Field>
        </div>
        <aside className="form-side">
          <StatusField value={page?.status ?? "draft"} />
          <Field label="Alamat (slug)" htmlFor="slug" hint="Halaman dibuka di /halaman/alamat-ini. Kosongkan agar dibuat dari judul.">
            <input id="slug" name="slug" type="text" defaultValue={page?.slug ?? ""} maxLength={100} />
          </Field>
          <label className="check">
            <input type="checkbox" name="in_footer" defaultChecked={page?.in_footer ?? true} />
            <span>Tampilkan tautannya di kaki situs</span>
          </label>
          <div className="form-actions">
            <SubmitButton />
            <Link href="/admin/halaman" className="btn btn--line">
              Batal
            </Link>
          </div>
        </aside>
      </form>
      {page && (
        <form action={deletePage} className="form-danger">
          <input type="hidden" name="id" value={page.id} />
          <ConfirmButton label="Hapus halaman ini" message={`Hapus halaman "${page.title}"?`} />
        </form>
      )}
    </>
  );
}
