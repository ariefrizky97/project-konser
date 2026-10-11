"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "@/lib/toast";
import { IconFacebook, IconInstagram, IconLink, IconTelegram, IconThreads, IconWhatsapp, IconX } from "./Icons";

/** Salin lewat textarea tersembunyi: cara lama yang tetap jalan bila izin papan klip ditolak. */
function copyByCommand(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
  document.body.append(area);
  area.select();
  let done = false;
  try {
    done = document.execCommand("copy");
  } catch {
    done = false;
  }
  area.remove();
  return done;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return copyByCommand(text);
  }
}

/** Ponsel dan tablet (iPad melapor sebagai Mac, jadi dicek juga dari layar sentuhnya). */
const isHandheld = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

/**
 * Tombol berbagi artikel atau event, berupa ikon saja. Nama layanan tetap ada
 * sebagai label untuk pembaca layar dan muncul saat ikon disorot.
 */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const [sheet, setSheet] = useState<{ copied: boolean } | null>(null);
  const openButton = useRef<HTMLAnchorElement>(null);
  const [mod, setMod] = useState("Ctrl");

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setMod("⌘");
  }, []);

  // Panel Instagram: fokus ke tombol utama, Esc menutup.
  useEffect(() => {
    if (!sheet) return;
    openButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheet(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet]);

  async function copy(message = "Tautan tersalin."): Promise<boolean> {
    if (await copyText(url)) {
      void toast(message);
      return true;
    }
    window.prompt("Salin tautan ini:", url);
    return false;
  }

  // Instagram tidak punya alamat web untuk membagikan tautan (tidak ada padanan wa.me atau
  // t.me/share), dan situs web tidak bisa mengisi pesan Instagram secara otomatis. Jadi:
  // - Ponsel/tablet: menu berbagi bawaan perangkat, yang memuat Instagram (Direct, Story).
  // - Komputer: menu berbagi macOS/Windows tidak memuat Instagram, jadi tautan langsung disalin
  //   dan panel petunjuk muncul dengan tombol untuk membuka Instagram Direct di tab baru.
  async function instagram() {
    if (isHandheld() && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
      }
    }
    setSheet({ copied: await copyText(url) });
  }

  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, Icon: IconWhatsapp },
    { label: "X", href: `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`, Icon: IconX },
    { label: "Facebook", href: `https://www.facebook.com/sharer.php?u=${encodedUrl}`, Icon: IconFacebook },
    { label: "Telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, Icon: IconTelegram },
  ];

  return (
    <div className="share">
      <span className="share-label">Bagikan</span>
      {links.map(({ label, href, Icon }) => (
        <a
          key={label}
          className="share-btn"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Bagikan ke ${label}`}
          title={label}
        >
          <Icon />
        </a>
      ))}
      <button type="button" className="share-btn" onClick={() => void instagram()} aria-label="Bagikan ke Instagram" title="Instagram">
        <IconInstagram />
      </button>
      <a
        className="share-btn"
        href={`https://www.threads.net/intent/post?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan ke Threads"
        title="Threads"
      >
        <IconThreads />
      </a>
      <button type="button" className="share-btn" onClick={() => void copy()} aria-label="Salin tautan" title="Salin tautan">
        <IconLink />
      </button>

      {sheet &&
        createPortal(
        <div className="ig-sheet" role="presentation" onClick={(event) => event.target === event.currentTarget && setSheet(null)}>
          <div className="ig-card" role="dialog" aria-modal="true" aria-labelledby="ig-title">
            <div className="ig-head">
              <span className="ig-badge" aria-hidden="true">
                <IconInstagram />
              </span>
              <div>
                <h2 id="ig-title">Kirim ke Instagram</h2>
                <p className={sheet.copied ? "ig-status is-ok" : "ig-status"} aria-live="polite">
                  {sheet.copied ? "Tautan artikel sudah disalin." : "Salin tautan di bawah ini lebih dulu."}
                </p>
              </div>
              <button type="button" className="ig-close" aria-label="Tutup" onClick={() => setSheet(null)}>
                ×
              </button>
            </div>
            <div className="ig-field">
              <input readOnly value={url} aria-label="Tautan artikel" onFocus={(event: React.FocusEvent<HTMLInputElement>) => event.target.select()} />
              <button
                type="button"
                onClick={async () => {
                  const done = await copyText(url);
                  setSheet({ copied: done });
                  if (done) void toast("Tautan tersalin.");
                }}
              >
                Salin
              </button>
            </div>
            <ol className="ig-steps">
              <li>Buka Instagram Direct lewat tombol di bawah.</li>
              <li>Pilih teman atau grup yang akan dikirimi.</li>
              <li>
                Tempel tautannya ({mod}+V) di kolom pesan, lalu kirim.
              </li>
            </ol>
            <p className="ig-note">
              Instagram tidak mengizinkan situs lain mengisi pesan secara otomatis, jadi tautannya perlu ditempel. Untuk Story,
              bagikan dari ponsel: ketuk ikon Instagram di sana, lalu pilih Instagram di menu berbagi.
            </p>
            <div className="ig-actions">
              <a
                ref={openButton}
                className="ig-open"
                href="https://www.instagram.com/direct/new/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSheet(null)}
              >
                Buka Instagram Direct
              </a>
              <button type="button" className="ig-later" onClick={() => setSheet(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
}
