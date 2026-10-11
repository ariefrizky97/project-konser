import axios from "axios";

// Cuaca dari Open-Meteo (gratis, tanpa kunci API): https://open-meteo.com/en/docs
// Kota diatur lewat WEATHER_CITY, WEATHER_LAT, dan WEATHER_LON di .env. Bawaannya Jakarta.

export type WeatherKind = "cerah" | "berawan" | "kabut" | "gerimis" | "hujan" | "badai";
export type DayPeriod = "pagi" | "siang" | "sore" | "malam";

export type WeatherDay = { key: string; weekday: string; high: number; low: number; kind: WeatherKind };

export type Weather = {
  city: string;
  temp: number;
  label: string;
  kind: WeatherKind;
  /** Bagian hari saat ini di zona waktu WIB. Ikon dan keterangan menyesuaikan. */
  period: DayPeriod;
  /** Benar bila matahari sudah terbenam di lokasi, menurut layanan cuaca. */
  night: boolean;
  humidity: number;
  wind: number;
  high: number;
  low: number;
  days: WeatherDay[];
};

/** Kode cuaca WMO menjadi jenis ikon dan keterangan. */
function describe(code: number): { kind: WeatherKind; label: string } {
  if (code === 0) return { kind: "cerah", label: "Cerah" };
  if (code === 1 || code === 2) return { kind: "berawan", label: "Cerah berawan" };
  if (code === 3) return { kind: "berawan", label: "Berawan" };
  if (code === 45 || code === 48) return { kind: "kabut", label: "Berkabut" };
  if (code >= 51 && code <= 57) return { kind: "gerimis", label: "Gerimis" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { kind: "hujan", label: "Hujan" };
  if (code >= 95) return { kind: "badai", label: "Hujan petir" };
  return { kind: "berawan", label: "Berawan" };
}

/** Bagian hari menurut jam WIB: pagi 04–10, siang 10–15, sore 15–18, selebihnya malam. */
export function dayPeriod(date: Date = new Date()): DayPeriod {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", hourCycle: "h23" }).format(date),
  );
  if (hour >= 4 && hour < 10) return "pagi";
  if (hour >= 10 && hour < 15) return "siang";
  if (hour >= 15 && hour < 18) return "sore";
  return "malam";
}

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const FRESH_MS = 30 * 60 * 1000;
const RETRY_MS = 5 * 60 * 1000;

// Hasil disimpan di memori supaya tidak setiap pengunjung memanggil layanan cuaca.
const store = globalThis as unknown as { __weather?: { at: number; data: Weather | null } };

/** Cuaca saat ini dan prakiraan lima hari. Null bila layanan tidak bisa dihubungi. */
export async function getWeather(): Promise<Weather | null> {
  const cached = store.__weather;
  if (cached && Date.now() - cached.at < (cached.data ? FRESH_MS : RETRY_MS)) {
    // Suhu boleh berumur 30 menit, tetapi pagi/siang/sore/malam selalu dihitung ulang.
    return cached.data ? { ...cached.data, period: dayPeriod() } : null;
  }

  const city = process.env.WEATHER_CITY || "Jakarta";
  const latitude = Number(process.env.WEATHER_LAT || -6.2);
  const longitude = Number(process.env.WEATHER_LON || 106.82);

  let data: Weather | null = null;
  try {
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
      daily: "weather_code,temperature_2m_max,temperature_2m_min",
      timezone: "Asia/Jakarta",
      forecast_days: "5",
    });
    const response = await axios.get(`https://api.open-meteo.com/v1/forecast?${query.toString()}`, {
      timeout: 4000,
    });
    const current = response.data?.current;
    const daily = response.data?.daily;
    if (current && daily?.time?.length) {
      const now = describe(Number(current.weather_code));
      data = {
        city,
        temp: Math.round(current.temperature_2m),
        label: now.label,
        kind: now.kind,
        period: dayPeriod(),
        night: Number(current.is_day) === 0,
        humidity: Math.round(current.relative_humidity_2m),
        wind: Math.round(current.wind_speed_10m),
        high: Math.round(daily.temperature_2m_max[0]),
        low: Math.round(daily.temperature_2m_min[0]),
        days: (daily.time as string[]).map((key, index) => ({
          key,
          weekday: WEEKDAYS[new Date(`${key}T00:00:00Z`).getUTCDay()],
          high: Math.round(daily.temperature_2m_max[index]),
          low: Math.round(daily.temperature_2m_min[index]),
          kind: describe(Number(daily.weather_code[index])).kind,
        })),
      };
    }
  } catch (error) {
    console.error("Cuaca: gagal mengambil data.", axios.isAxiosError(error) ? error.message : error);
  }

  store.__weather = { at: Date.now(), data };
  return data;
}
