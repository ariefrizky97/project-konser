import { param } from "@/lib/format";

const OK: Record<string, string> = {
  terkirim: "Terima kasih, kiriman Anda sudah kami terima. Redaksi akan meninjaunya.",
  langganan: "Terima kasih, email Anda sudah terdaftar di buletin.",
};

const ERRORS: Record<string, string> = {
  lengkapi: "Lengkapi isian yang wajib dan pastikan alamat emailnya benar.",
  "terlalu-sering": "Terlalu banyak kiriman dari jaringan ini. Coba lagi sepuluh menit lagi.",
  email: "Alamat email itu tidak sah. Periksa lagi penulisannya.",
};

/** Pesan hasil kiriman form publik, dibaca dari ?ok= dan ?galat= di alamat. */
export function FormNote({ query }: { query: Record<string, string | string[] | undefined> }) {
  const ok = OK[param(query.ok)];
  const error = ERRORS[param(query.galat)];
  if (!ok && !error) return null;
  return (
    <p className={`formnote${error ? " formnote--error" : ""}`} role={error ? "alert" : "status"}>
      {error ?? ok}
    </p>
  );
}
