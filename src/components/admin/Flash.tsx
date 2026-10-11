import { ToastOnLoad } from "@/components/site/ToastOnLoad";
import { param } from "@/lib/format";

const OK: Record<string, string> = {
  tersimpan: "Tersimpan.",
  terhapus: "Terhapus.",
  diunggah: "Gambar diunggah.",
  sandi: "Kata sandi diganti.",
  profil: "Profil disimpan.",
  diajukan: "Artikel diajukan untuk ditinjau admin.",
  dikembalikan: "Versi lama dikembalikan.",
  pratinjau: "Tautan pratinjau dibuat.",
  "pratinjau-hapus": "Tautan pratinjau dimatikan.",
  "dari-pengajuan": "Draf event dibuat dari pengajuan. Periksa isinya, lalu terbitkan.",
  pengingat: "Pengingat backup disimpan.",
  youtube: "Daftar video diambil ulang dari YouTube.",
  dipulihkan: "Restore berhasil: isi situs sudah dikembalikan dari berkas backup.",
};

const ERRORS: Record<string, string> = {
  judul: "Judul wajib diisi.",
  "menu-kosong": "Menu navbar tidak boleh kosong. Tambahkan paling sedikit satu menu.",
  nama: "Nama wajib diisi.",
  tanggal: "Waktu mulai wajib diisi.",
  gambar: "Template banner gambar butuh gambar. Pilih atau unggah gambar dulu.",
  "judul-iklan": "Judul iklan wajib diisi untuk template ini.",
  youtube: "Tautan video harus berupa tautan YouTube, misalnya https://youtu.be/… atau https://www.youtube.com/watch?v=…",
  akses: "Menu itu hanya bisa dibuka oleh admin.",
  frekuensi: "Pilih salah satu jadwal pengingat: mati, harian, mingguan, bulanan, atau tahunan.",
  konfirmasi: "Ketik PULIHKAN (huruf besar) untuk memastikan Anda memang ingin memulihkan.",
  "cadangan-centang": "Centang pernyataan bahwa Anda sudah mengunduh cadangan terbaru sebelum memulihkan.",
  "cadangan-kosong": "Pilih berkas cadangan (.json) dulu.",
  "cadangan-jenis": "Berkas cadangan harus berakhiran .json, seperti yang diunduh dari halaman ini.",
  "cadangan-besar": "Berkas cadangan melebihi 50 MB.",
  "cadangan-rusak": "Berkas itu tidak bisa dibaca sebagai JSON. Mungkin rusak atau terpotong saat diunduh.",
  "cadangan-format": "Berkas itu bukan cadangan Project Konser.",
  "cadangan-versi": "Cadangan itu dibuat oleh versi situs yang lebih baru. Perbarui situs dulu lalu coba lagi.",
  "cadangan-ubah": "Isi berkas cadangan tidak cocok dengan sidiknya: berkas sudah diubah atau rusak, jadi tidak dipulihkan.",
  "cadangan-tabel": "Berkas cadangan berisi tabel yang tidak dikenal database ini.",
  "cadangan-kolom": "Berkas cadangan berisi kolom yang tidak dikenal database ini. Jalankan npm run db:setup dulu, lalu coba lagi.",
  "cadangan-admin": "Berkas cadangan tidak berisi akun admin, jadi tidak dipulihkan supaya tidak ada yang terkunci di luar.",
  "cadangan-gagal": "Pemulihan gagal di tengah jalan dan dibatalkan seluruhnya. Database tetap seperti sebelumnya.",
  "youtube-baris": "Ada baris yang bukan tautan YouTube. Isi tautan playlist, kanal (youtube.com/channel/…), atau video, satu per baris.",
  "youtube-campur": "Pilih salah satu: satu tautan playlist/kanal saja, atau beberapa tautan video. Keduanya tidak bisa dicampur.",
  "youtube-banyak": "Paling banyak 15 tautan video per kategori.",
  data: "Nama dan email yang sah wajib diisi.",
  "sandi-pendek": "Kata sandi minimal 8 karakter.",
  "sandi-salah": "Kata sandi saat ini tidak cocok.",
  "email-dipakai": "Email itu sudah dipakai pengguna lain.",
  "diri-sendiri": "Anda tidak bisa menghapus akun sendiri.",
  salah: "Email atau kata sandi tidak cocok.",
  "terlalu-sering": "Terlalu banyak percobaan. Tunggu sepuluh menit lalu coba lagi.",
  kosong: "Pilih file gambar dulu.",
  jenis: "Jenis file tidak didukung. Pakai JPG, PNG, WebP, GIF, atau AVIF.",
  besar: "Ukuran gambar melebihi 10 MB. Perkecil dulu lalu unggah lagi.",
  asal: "Permintaan ditolak karena berasal dari situs lain.",
  imagekit: "ImageKit belum diatur. Isi IMAGEKIT_PRIVATE_KEY di file .env lalu jalankan ulang server.",
  unggah: "Gagal mengunggah ke ImageKit. Coba lagi.",
  "hapus-imagekit": "Berkas gagal dihapus dari ImageKit, jadi catatannya belum dihapus. Coba lagi.",
};

const NOTES: Record<string, string> = {
  selesai: "Waktu selesai lebih awal dari waktu mulai, jadi tidak disimpan.",
};

/**
 * Pesan hasil aksi, dibaca dari parameter URL (?ok=, ?galat=, ?catatan=).
 * Berhasil tampil sebagai toast. Galat tampil sebagai toast dan tetap tertulis di halaman
 * supaya masih terbaca setelah toast hilang.
 */
export function Flash({ query }: { query: Record<string, string | string[] | undefined> }) {
  const ok = OK[param(query.ok)];
  const error = ERRORS[param(query.galat)];
  const note = NOTES[param(query.catatan)];
  if (!ok && !error && !note) return null;
  return (
    <>
      {ok && <ToastOnLoad text={ok} kind="ok" />}
      {error && <ToastOnLoad text={error} kind="error" />}
      {(error || note) && (
        <div className="flash-stack">
          {note && (
            <p className="flash flash--note" role="status">
              {note}
            </p>
          )}
          {error && (
            <p className="flash flash--error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </>
  );
}
