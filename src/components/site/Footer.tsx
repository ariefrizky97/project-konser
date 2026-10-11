import Link from "next/link";
import { subscribe } from "@/lib/actions/newsletter";
import { listCategories, listFooterPages } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { Logo } from "./Logo";
import { Social } from "./Social";

export async function Footer() {
  const [settings, categories, pages] = await Promise.all([getSettings(), listCategories(), listFooterPages()]);
  return (
    <footer className="ft">
      <div className="wrap ft-grid">
        <div className="ft-brand">
          <Logo name={settings.site_name} />
          <p>{settings.description}</p>
          <Social settings={settings} />
          {/* Langganan buletin. Email tersimpan di Admin > Buletin. */}
          <form action={subscribe} className="ft-news" id="buletin">
            <label htmlFor="ft-email">Buletin: kabar pilihan tiap pekan</label>
            <div className="ft-news-row">
              <input id="ft-email" name="email" type="email" placeholder="Alamat email" autoComplete="email" required />
              <button type="submit">Langganan</button>
            </div>
            <input className="pfield-trap" name="situs" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          </form>
        </div>
        <nav aria-label="Jelajah">
          <h2 className="ft-title">Jelajah</h2>
          <ul>
            <li><Link href="/berita">Berita</Link></li>
            <li><Link href="/event">Agenda event</Link></li>
            <li><Link href="/direktori">Direktori</Link></li>
            <li><Link href="/tentang">Tentang kami</Link></li>
            {pages.map((page) => (
              <li key={page.id}>
                <Link href={`/halaman/${page.slug}`}>{page.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Kategori berita">
          <h2 className="ft-title">Kategori</h2>
          <ul>
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={`/berita?kategori=${category.slug}`}>{category.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="ft-title">Hubungi</h2>
          <ul>
            {settings.contact_email && (
              <li><a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></li>
            )}
            <li><Link href="/kontak">Kontak redaksi</Link></li>
            <li><Link href="/kontak?perihal=iklan">Pasang iklan</Link></li>
          </ul>
        </div>
      </div>
      <div className="wrap ft-base">
        <p className="ft-copy">
          © Copyright {new Date().getFullYear()}, All Rights Reserved, Powered by {settings.site_name} | Portal Info Musik | Konser
          Update | Media Partner | Film
        </p>
      </div>
    </footer>
  );
}
