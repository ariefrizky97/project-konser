"use client";

import { useEffect, useState } from "react";

function parts(target: number, now: number) {
  const total = Math.max(0, Math.floor((target - now) / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: total === 0,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Hitung mundur ke waktu mulai event. Server mengirim angka awal lewat `now`,
 * lalu angka berjalan di browser setiap detik.
 */
export function Countdown({ target, now }: { target: string; now: string }) {
  const targetTime = new Date(target).getTime();
  const [current, setCurrent] = useState(() => new Date(now).getTime());

  useEffect(() => {
    setCurrent(Date.now());
    const timer = window.setInterval(() => setCurrent(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const time = parts(targetTime, current);
  if (time.done) return <p className="count count--done">Sedang berlangsung</p>;

  const cells: [string, string][] = [
    [String(time.days), "hari"],
    [pad(time.hours), "jam"],
    [pad(time.minutes), "menit"],
    [pad(time.seconds), "detik"],
  ];

  return (
    <div className="count" role="timer" aria-label="Hitung mundur sampai acara mulai">
      {cells.map(([value, label]) => (
        <div className="count-cell" key={label}>
          {/* key berganti tiap angka berubah supaya animasi kedip berjalan lagi */}
          <span className="count-num" key={value}>
            {value}
          </span>
          <span className="count-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
