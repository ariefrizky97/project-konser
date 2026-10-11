import type { Metadata } from "next";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormNote } from "@/components/site/FormNote";
import { submitMessage } from "@/lib/actions/inbox";
import { param } from "@/lib/format";

export const metadata: Metadata = {
  title: "Kontak dan pasang iklan",
  description: "Hubungi redaksi, kirim koreksi, atau tanyakan pemasangan iklan.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ContactPage({ searchParams }: Props) {
  const query = await searchParams;
  const ads = param(query.perihal) === "iklan";

  return (
    <div className="wrap page page--narrow">
      <header className="page-head">
        <p className="eyebrow">Hubungi kami</p>
        <h1 className="page-title">{ads ? "Pasang iklan" : "Kontak redaksi"}</h1>
        <p className="lede">
          {ads
            ? "Ceritakan kebutuhan Anda: slot yang diminati, lama tayang, dan materi yang sudah ada. Kami membalas lewat email."
            : "Koreksi berita, usulan liputan, kerja sama, atau pertanyaan lain. Kami membalas lewat email."}
        </p>
      </header>

      <FormNote query={query} />

      <form action={submitMessage} className="pform">
        <fieldset className="pform-set">
          <legend>Pesan Anda</legend>
          <label className="pfield">
            <span>Perihal *</span>
            <select name="kind" defaultValue={ads ? "iklan" : "pesan"}>
              <option value="pesan">Pesan untuk redaksi</option>
              <option value="iklan">Pasang iklan</option>
            </select>
          </label>
          <label className="pfield">
            <span>Judul pesan *</span>
            <input name="subject" type="text" maxLength={200} required />
          </label>
          <label className="pfield pfield--wide">
            <span>Isi pesan *</span>
            <textarea name="body" rows={6} maxLength={5000} required />
          </label>
          <label className="pfield">
            <span>Nama *</span>
            <input name="name" type="text" maxLength={120} autoComplete="name" required />
          </label>
          <label className="pfield">
            <span>Email *</span>
            <input name="email" type="email" maxLength={160} autoComplete="email" required />
          </label>
          <label className="pfield">
            <span>Nomor WhatsApp</span>
            <input name="phone" type="tel" maxLength={40} autoComplete="tel" />
          </label>
          <label className="pfield-trap" aria-hidden="true">
            Situs
            <input name="situs" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </fieldset>
        <div className="pform-actions">
          <SubmitButton label="Kirim pesan" pendingLabel="Mengirim…" />
        </div>
      </form>
    </div>
  );
}
