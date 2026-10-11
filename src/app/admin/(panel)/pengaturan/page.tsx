import type { Metadata } from "next";
import { Editor } from "@/components/admin/Editor";
import { Flash } from "@/components/admin/Flash";
import { Field, PageHead } from "@/components/admin/ui";
import { saveSettings } from "@/lib/actions/settings";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Pengaturan" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SettingsPage({ searchParams }: Props) {
  await requireAdmin();
  const [query, settings] = await Promise.all([searchParams, getSettings()]);

  return (
    <>
      <PageHead title="Pengaturan" description="Nama situs, teks halaman Tentang, dan kontak." />
      <Flash query={query} />

      <form action={saveSettings} className="form form--single">
        <div className="form-main">
          <div className="field-row">
            <Field label="Nama situs" htmlFor="site_name" hint="Tampil sebagai logo di header dan di judul tab.">
              <input id="site_name" name="site_name" type="text" defaultValue={settings.site_name} maxLength={60} required />
            </Field>
            <Field label="Tagline" htmlFor="tagline">
              <input id="tagline" name="tagline" type="text" defaultValue={settings.tagline} maxLength={120} />
            </Field>
          </div>
          <Field label="Deskripsi singkat" htmlFor="description" hint="Dipakai mesin pencari dan tampil di kaki situs.">
            <textarea id="description" name="description" rows={2} maxLength={300} defaultValue={settings.description} />
          </Field>
          <Field label="Teks halaman Tentang" htmlFor="about" hint="Beri judul bagian “Pasang iklan” supaya tautan pasang iklan di situs mengarah ke sana.">
            <Editor name="about" defaultValue={settings.about} rows={12} />
          </Field>
          <div className="field-row">
            <Field label="Email kontak" htmlFor="contact_email">
              <input id="contact_email" name="contact_email" type="email" defaultValue={settings.contact_email} maxLength={160} />
            </Field>
            <Field label="Instagram" htmlFor="instagram">
              <input id="instagram" name="instagram" type="text" inputMode="url" defaultValue={settings.instagram} placeholder="https://instagram.com/…" />
            </Field>
          </div>
          <div className="field-row">
            <Field label="YouTube" htmlFor="youtube">
              <input id="youtube" name="youtube" type="text" inputMode="url" defaultValue={settings.youtube} placeholder="https://youtube.com/…" />
            </Field>
            <Field label="TikTok" htmlFor="tiktok">
              <input id="tiktok" name="tiktok" type="text" inputMode="url" defaultValue={settings.tiktok} placeholder="https://tiktok.com/…" />
            </Field>
          </div>
          <Field label="Threads" htmlFor="threads">
            <input id="threads" name="threads" type="text" inputMode="url" defaultValue={settings.threads} placeholder="https://www.threads.com/@…" />
          </Field>
          <Field label="Facebook" htmlFor="facebook">
            <input id="facebook" name="facebook" type="text" inputMode="url" defaultValue={settings.facebook} placeholder="https://facebook.com/…" />
          </Field>
          <div className="form-actions">
            <button type="submit" className="btn">
              Simpan
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
