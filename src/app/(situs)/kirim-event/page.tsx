import type { Metadata } from "next";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormNote } from "@/components/site/FormNote";
import { submitEvent } from "@/lib/actions/inbox";
import { listEventTypes } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Kirim event",
  description: "Punya konser, festival, atau acara? Kirim datanya ke redaksi untuk dimuat di agenda.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SubmitEventPage({ searchParams }: Props) {
  const [query, types] = await Promise.all([searchParams, listEventTypes()]);

  return (
    <div className="wrap page page--narrow">
      <header className="page-head">
        <p className="eyebrow">Agenda</p>
        <h1 className="page-title">Kirim event</h1>
        <p className="lede">
          Punya konser, festival, pameran, atau acara lain? Isi datanya di sini. Redaksi meninjau tiap kiriman
          sebelum memuatnya di agenda, dan menghubungi Anda bila ada yang perlu dilengkapi.
        </p>
      </header>

      <FormNote query={query} />

      <form action={submitEvent} className="pform">
        <fieldset className="pform-set">
          <legend>Tentang acaranya</legend>
          <label className="pfield pfield--wide">
            <span>Nama event *</span>
            <input name="title" type="text" maxLength={200} required />
          </label>
          <label className="pfield">
            <span>Jenis</span>
            <select name="type_id" defaultValue="">
              <option value="">Pilih jenis</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <label className="pfield">
            <span>Penyelenggara</span>
            <input name="organizer_name" type="text" maxLength={160} />
          </label>
          <label className="pfield">
            <span>Mulai (WIB) *</span>
            <input name="starts_at" type="datetime-local" required />
          </label>
          <label className="pfield">
            <span>Selesai (WIB)</span>
            <input name="ends_at" type="datetime-local" />
          </label>
          <label className="pfield">
            <span>Tempat</span>
            <input name="venue_name" type="text" maxLength={160} placeholder="Nama gedung atau lokasi" />
          </label>
          <label className="pfield">
            <span>Kota</span>
            <input name="city" type="text" maxLength={80} />
          </label>
          <label className="pfield">
            <span>Harga tiket</span>
            <input name="price_info" type="text" maxLength={200} placeholder="Contoh: Rp150.000 atau Gratis" />
          </label>
          <label className="pfield">
            <span>Tautan tiket atau info</span>
            <input name="ticket_url" type="text" inputMode="url" maxLength={500} placeholder="https://…" />
          </label>
          <label className="pfield pfield--wide">
            <span>Keterangan</span>
            <textarea name="body" rows={5} maxLength={5000} placeholder="Pengisi acara, susunan acara, dan hal lain yang perlu diketahui penonton." />
          </label>
        </fieldset>

        <fieldset className="pform-set">
          <legend>Kontak Anda</legend>
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
          {/* Isian jebakan untuk robot; disembunyikan dari pengunjung. */}
          <label className="pfield-trap" aria-hidden="true">
            Situs
            <input name="situs" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </fieldset>

        <div className="pform-actions">
          <SubmitButton label="Kirim event" pendingLabel="Mengirim…" />
          <p>Kontak Anda hanya dipakai redaksi untuk menindaklanjuti kiriman ini.</p>
        </div>
      </form>
    </div>
  );
}
