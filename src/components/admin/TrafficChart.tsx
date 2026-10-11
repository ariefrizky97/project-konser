"use client";

import { useState } from "react";

export type ChartDay = { day: string; label: string; short: string; views: number; visitors: number };

/** Batas atas sumbu yang enak dibaca: 1, 2, atau 5 kali pangkat sepuluh. */
function niceMax(value: number): number {
  if (value <= 4) return 4;
  const power = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 1.5, 2, 3, 4, 5, 8, 10]) if (value <= step * power) return step * power;
  return 10 * power;
}

const number = (value: number) => value.toLocaleString("id-ID");

/**
 * Diagram batang tayangan halaman per hari. Menyorot (atau memfokus) satu hari
 * menampilkan angka hari itu; tabel lengkapnya ada di bawah diagram.
 */
export function TrafficChart({
  days,
  units = ["tayangan", "pengunjung"],
  title = "Tayangan halaman per hari",
}: {
  days: ChartDay[];
  /** Nama dua angka di keterangan: yang digambar sebagai batang, lalu angka pendampingnya. */
  units?: [string, string];
  title?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...days.map((day) => day.views), 0));
  const ticks = [max, max / 2, 0];
  const every = days.length > 45 ? 14 : days.length > 14 ? 7 : 1;
  const shown = active === null ? null : days[active];

  return (
    <figure className="tchart">
      <div className="tchart-plot" onMouseLeave={() => setActive(null)}>
        <div className="tchart-grid" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} style={{ bottom: `${(tick / max) * 100}%` }}>
              <i>{number(tick)}</i>
            </span>
          ))}
        </div>
        <div className="tchart-bars" role="img" aria-label={`${title}, ${days.length} hari terakhir`}>
          {days.map((day, index) => (
            <button
              type="button"
              key={day.day}
              className={`tchart-col${active === index ? " is-active" : ""}`}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              aria-label={`${day.label}: ${number(day.views)} ${units[0]}, ${number(day.visitors)} ${units[1]}`}
            >
              <span className="tchart-bar" style={{ height: `${(day.views / max) * 100}%` }} />
            </button>
          ))}
        </div>
        {shown && active !== null && (
          <div
            className="tchart-tip"
            role="status"
            style={{ left: `${((active + 0.5) / days.length) * 100}%` }}
            data-side={active > days.length / 2 ? "kiri" : "kanan"}
          >
            <strong>{shown.label}</strong>
            <span>
              <b>{number(shown.views)}</b> {units[0]}
            </span>
            <span>
              <b>{number(shown.visitors)}</b> {units[1]}
            </span>
          </div>
        )}
      </div>
      <div className="tchart-axis" aria-hidden="true">
        {days.map((day, index) => (
          <span key={day.day}>{(days.length - 1 - index) % every === 0 ? day.short : ""}</span>
        ))}
      </div>
    </figure>
  );
}
