import { CountUp } from "./CountUp";
import { getWeather, type DayPeriod, type WeatherKind } from "@/lib/weather";

const PERIOD_LABEL: Record<DayPeriod, string> = {
  pagi: "Pagi ini",
  siang: "Siang ini",
  sore: "Sore ini",
  malam: "Malam ini",
};

/**
 * Ikon cuaca. Saat malam, matahari diganti bulan: langit cerah menjadi bulan sabit,
 * berawan menjadi bulan di balik awan.
 */
export function WeatherIcon({ kind, night = false, size = 24 }: { kind: WeatherKind; night?: boolean; size?: number }) {
  const moon = <path className="wx-moon" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />;
  return (
    <svg
      className={`wx wx--${kind}${night ? " wx--night" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {kind === "cerah" && !night && (
        <>
          <circle cx="12" cy="12" r="4.2" />
          <path className="wx-rays" d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
        </>
      )}
      {kind === "cerah" && night && moon}
      {kind === "berawan" && !night && <path className="wx-cloud" d="M7 18h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 9.2 4.4 4.4 0 0 0 7 18z" />}
      {kind === "berawan" && night && (
        <>
          <path className="wx-moon" d="M17.5 4.2a4.6 4.6 0 0 0 3.6 6.1 4.8 4.8 0 0 1-3.1.9" />
          <path className="wx-cloud" d="M6.5 19h9.2a3.7 3.7 0 0 0 .5-7.35A5.1 5.1 0 0 0 6.6 10.9 4.1 4.1 0 0 0 6.5 19z" />
        </>
      )}
      {kind === "kabut" && (
        <>
          <path d="M7 13h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 4.2 4.4 4.4 0 0 0 7 13z" />
          <path className="wx-mist" d="M5 17h14M7 21h10" />
        </>
      )}
      {(kind === "gerimis" || kind === "hujan") && (
        <>
          <path d="M7 14h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 5.2 4.4 4.4 0 0 0 7 14z" />
          <path className="wx-drops" d={kind === "hujan" ? "M8 17.5l-1 3M12 17.5l-1 3M16 17.5l-1 3" : "M9 18v1.5M15 18v1.5"} />
        </>
      )}
      {kind === "badai" && (
        <>
          <path d="M7 13h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 4.2 4.4 4.4 0 0 0 7 13z" />
          <path className="wx-bolt" d="M12.5 14.5l-2.5 3.5h3l-2 3.5" />
        </>
      )}
    </svg>
  );
}

/** Cuaca ringkas di bilah atas: ikon sesuai waktu, kota, dan suhu saat ini. */
export async function WeatherChip() {
  const weather = await getWeather();
  if (!weather) return null;
  const night = weather.night || weather.period === "malam";
  return (
    <span className="bar-weather" data-period={weather.period} title={`${PERIOD_LABEL[weather.period]} di ${weather.city}: ${weather.label.toLowerCase()}`}>
      <WeatherIcon kind={weather.kind} night={night} size={18} />
      <span>
        {weather.city} {weather.temp}°C
      </span>
      <span className="bar-weather-period">{PERIOD_LABEL[weather.period].replace(" ini", "")}</span>
    </span>
  );
}

/** Widget cuaca di kolom samping: kondisi saat ini dan prakiraan lima hari. */
export async function WeatherWidget() {
  const weather = await getWeather();
  const night = weather ? weather.night || weather.period === "malam" : false;
  return (
    <section className={`widget weather${night ? " weather--night" : ""}`} aria-labelledby="w-cuaca">
      <h2 className="widget-title" id="w-cuaca">
        Cuaca
      </h2>
      {!weather ? (
        <p className="widget-empty">Data cuaca belum bisa dimuat. Coba lagi beberapa menit lagi.</p>
      ) : (
        <>
          <div className="weather-now">
            <div>
              <p className="weather-city">{weather.city}</p>
              <p className="weather-label">
                {PERIOD_LABEL[weather.period]}, {weather.label.toLowerCase()}
              </p>
            </div>
            <WeatherIcon kind={weather.kind} night={night} size={54} />
          </div>
          <p className="weather-temp" aria-label={`${weather.temp} derajat Celsius`}>
            <CountUp value={weather.temp} />
            <span>°C</span>
          </p>
          <dl className="weather-facts">
            <div>
              <dt>Tertinggi / terendah</dt>
              <dd>
                {weather.high}° / {weather.low}°
              </dd>
            </div>
            <div>
              <dt>Kelembapan</dt>
              <dd>{weather.humidity}%</dd>
            </div>
            <div>
              <dt>Angin</dt>
              <dd>{weather.wind} km/jam</dd>
            </div>
          </dl>
          <ol className="weather-days" aria-label="Prakiraan lima hari">
            {weather.days.map((day) => (
              <li key={day.key}>
                <WeatherIcon kind={day.kind} size={22} />
                <span className="weather-day-temp">{day.high}°</span>
                <span className="weather-day-name">{day.weekday}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
