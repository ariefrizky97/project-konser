"use client";

import { useEffect, useRef, useState } from "react";
import { AdView } from "@/components/site/AdView";
import {
  AD_TEMPLATES,
  AD_TONES,
  type AdContent,
  type AdSlotName,
  type AdTemplate,
  type AdTone,
} from "@/lib/types";

type PreviewState = AdContent & { slot: AdSlotName };

function read(form: HTMLFormElement, fallback: PreviewState): PreviewState {
  const data = new FormData(form);
  const text = (key: string) => String(data.get(key) ?? "");
  const template = text("template") as AdTemplate;
  const tone = text("tone") as AdTone;
  return {
    slot: text("slot") === "inline" ? "inline" : "header",
    template: AD_TEMPLATES.includes(template) ? template : fallback.template,
    tone: AD_TONES.includes(tone) ? tone : fallback.tone,
    headline: text("headline"),
    subline: text("subline"),
    cta_label: text("cta_label"),
    image_url: text("image_url"),
  };
}

/**
 * Pratinjau iklan yang berubah saat form diisi. Komponen ini membaca isian
 * dari form tempatnya berada dan menggambar iklan dengan komponen yang sama
 * dengan situs.
 */
export function AdPreview({ initial }: { initial: PreviewState }) {
  const anchor = useRef<HTMLDivElement>(null);
  const [state, setState] = useState(initial);

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    const update = () =>
      setState((previous) => {
        const next = read(form, previous);
        return JSON.stringify(next) === JSON.stringify(previous) ? previous : next;
      });
    update();
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    // Pemilih gambar mengubah nilai lewat React, jadi perubahan itu dipantau berkala.
    const timer = window.setInterval(update, 600);
    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="adpreview" ref={anchor}>
      <p className="field-label">Pratinjau</p>
      <div className={`adpreview-stage adpreview-stage--${state.slot}`}>
        <div className={`adslot adslot--${state.slot}`}>
          <AdView ad={state} href="" />
        </div>
      </div>
      <p className="field-hint">
        {state.slot === "header"
          ? "Slot header: papan selebar isi halaman, kira-kira 970 × 220 di layar lebar. Untuk banner gambar siapkan 1940 × 440 px."
          : "Slot sela konten: selebar area isi, di beranda dan di bawah artikel."}
      </p>
    </div>
  );
}
