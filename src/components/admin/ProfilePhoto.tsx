"use client";

import { useRef, useState } from "react";
import { CENTER, cropStyle, parseCrop, type Crop } from "@/components/site/Avatar";
import { sized } from "@/lib/media";
import { MediaPicker, type PickerItem } from "./MediaPicker";

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index, all) => (index === 0 || index === all.length - 1 ? word[0] : ""))
    .join("")
    .toUpperCase() || "?";

/**
 * Foto profil dengan pengatur posisi: seret foto di lingkaran untuk menggeser, geser penggeser
 * untuk memperbesar. Hasilnya dikirim sebagai avatar_crop ("x,y,zoom") bersama form profil.
 */
export function ProfilePhoto({ name, url, crop, items }: { name: string; url: string; crop: string; items: PickerItem[] }) {
  const [src, setSrc] = useState(url);
  const [value, setValue] = useState<Crop>(parseCrop(crop));
  const drag = useRef<{ x: number; y: number; start: Crop } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const round = (number: number) => Math.round(number * 10) / 10;
  const encoded = src ? `${round(value.x)},${round(value.y)},${round(value.zoom * 100) / 100}` : "";

  function move(clientX: number, clientY: number) {
    const start = drag.current;
    const size = box.current?.getBoundingClientRect().width ?? 160;
    if (!start) return;
    // Menyeret foto ke kanan memperlihatkan bagian kirinya, jadi posisinya berkurang.
    const factor = 100 / (size * Math.max(1, start.start.zoom));
    setValue({
      ...start.start,
      x: Math.min(100, Math.max(0, start.start.x - (clientX - start.x) * factor)),
      y: Math.min(100, Math.max(0, start.start.y - (clientY - start.y) * factor)),
    });
  }

  function nudge(dx: number, dy: number) {
    setValue((now) => ({ ...now, x: Math.min(100, Math.max(0, now.x + dx)), y: Math.min(100, Math.max(0, now.y + dy)) }));
  }

  return (
    <div className="photo-adjust">
      <div className="photo-stage">
        <div
          ref={box}
          className={`photo-circle${src ? " is-movable" : ""}`}
          role={src ? "slider" : undefined}
          tabIndex={src ? 0 : -1}
          aria-label="Posisi foto: seret, atau pakai tombol panah"
          aria-valuetext={`${Math.round(value.x)}% dari kiri, ${Math.round(value.y)}% dari atas`}
          onPointerDown={(event: React.PointerEvent<HTMLDivElement>) => {
            if (!src) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, start: value };
          }}
          onPointerMove={(event: React.PointerEvent<HTMLDivElement>) => move(event.clientX, event.clientY)}
          onPointerUp={() => {
            drag.current = null;
          }}
          onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
            const step = event.shiftKey ? 10 : 2;
            const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
            const delta = map[event.key];
            if (delta) {
              event.preventDefault();
              nudge(delta[0], delta[1]);
            }
          }}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sized(src, 480)} alt="" draggable={false} style={cropStyle(value)} />
          ) : (
            <span className="photo-initials">{initials(name)}</span>
          )}
        </div>
        {src && (
          <div className="photo-controls">
            <label className="photo-zoom">
              <span>Perbesar</span>
              <input
                type="range"
                min={100}
                max={300}
                step={5}
                value={Math.round(value.zoom * 100)}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue({ ...value, zoom: Number(event.target.value) / 100 })}
                aria-label="Perbesar foto"
              />
              <output>{Math.round(value.zoom * 100)}%</output>
            </label>
            <button type="button" className="chip" onClick={() => setValue(CENTER)}>
              Ke tengah
            </button>
            <p className="field-hint">Seret foto di lingkaran untuk mengatur posisinya.</p>
          </div>
        )}
      </div>
      <MediaPicker
        name="avatar_url"
        defaultValue={url}
        items={items}
        preview={false}
        onChange={(next) => {
          if (next !== src) {
            setSrc(next);
            if (src) setValue(CENTER);
          }
        }}
      />
      <input type="hidden" name="avatar_crop" value={encoded} />
    </div>
  );
}
