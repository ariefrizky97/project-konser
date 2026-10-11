# Project Konser (projectkonser.id)

Portal media berisi berita, agenda event, dan direktori, lengkap dengan CMS admin dan slot iklan header yang bisa diatur. Dibangun dengan Next.js (App Router), TypeScript, dan PostgreSQL.

Nama situs, tagline, dan kontak tersimpan di database dan bisa diganti dari **Admin > Pengaturan**, tanpa menyentuh kode.

## Menjalankan di komputer sendiri

Yang dibutuhkan: Node.js 20.9 atau lebih baru, dan PostgreSQL 14 atau lebih baru.

```bash
# 1. Buat database kosong
createdb projectkonser

# 2. Salin pengaturan lalu isi DATABASE_URL, kunci ImageKit, dan email kedua admin
cp .env.example .env

# 3. Pasang dependensi
npm install

# 4. Buat tabel, dua akun admin, dan data contoh
npm run db:setup

# 5. Jalankan
npm run dev
```

Buka http://localhost:3000 untuk situs dan http://localhost:3000/admin untuk CMS.

### Akun admin

`npm run db:setup` membuat dua akun admin:

| Nama | Email bawaan | Diatur lewat |
| --- | --- | --- |
| Arief Rizky | `arief.rizky@contoh.id` | `ADMIN_1_NAME`, `ADMIN_1_EMAIL` |
| Andhika | `andhika@contoh.id` | `ADMIN_2_NAME`, `ADMIN_2_EMAIL` |

Halaman admin ada di `/admin`. Bila belum masuk, form masuk tampil langsung di alamat itu (alamat lama `/admin/masuk` dialihkan ke sana), dengan logo di tengah yang batangnya bergerak seperti ekualiser. Ganti kedua email di `.env` dengan alamat yang benar sebelum menjalankan setup. Kata sandi awal keduanya sama, yaitu `ADMIN_PASSWORD`; masing-masing menggantinya di menu **Pengguna** setelah masuk.

Sudah pernah menjalankan versi sebelumnya? Jalankan `npm install` dan `npm run db:setup` lagi. Tabel disesuaikan dan kedua akun ditambahkan tanpa menghapus konten. Slide contoh hanya diisi pada database kosong, jadi tambahkan slide dari admin atau jalankan `npm run db:reset` untuk mulai dari awal.

### ImageKit

Semua gambar disimpan di ImageKit. Isi `IMAGEKIT_PRIVATE_KEY` di `.env` dengan kunci privat dari dasbor ImageKit (Developer options > API keys). Tanpa kunci ini situs tetap jalan, tetapi unggah gambar ditolak dengan pesan yang menjelaskan sebabnya.

Perintah lain:

| Perintah | Kegunaan |
| --- | --- |
| `npm run db:setup -- --tanpa-contoh` | Buat tabel dan admin saja, tanpa data contoh |
| `npm run db:reset` | Hapus semua tabel lalu buat ulang dari awal |
| `npm run typecheck` | Periksa tipe TypeScript |
| `npm run build` lalu `npm start` | Jalankan versi produksi |

## Yang ada di dalamnya

**Situs publik**

- Kepala situs gelap, dari atas ke bawah: teks berjalan dengan ikon Instagram, TikTok, dan Threads, baris logo dengan cuaca, lalu navbar tembus pandang yang menempel di atas saat digulir
- Menu Berita di navbar membuka pilihan kategori
- Ruang iklan lebar di bawah navbar, di semua halaman
- Beranda: mozaik pembuka (slide foto dan video di kotak besar, empat artikel terbaru di sampingnya), pencari event, lalu kolom widget: hitung mundur, kalender event bulanan, cuaca, media sosial, terpopuler, tagar. Juga artikel terbaru, deret agenda, dan blok per kategori dengan video YouTube. Bila kolom widget lebih panjang dari kolom utama, widget paling bawah dipindah otomatis ke bawah kolom utama supaya tidak ada ruang kosong
- Berita: daftar per kategori dengan nomor halaman, halaman artikel dengan video YouTube, tagar, dan artikel terkait
- Tagar: tiap tagar punya halaman sendiri (`/tagar/<nama>`), dan pencarian menemukan `#tagar`
- Berbagi: WhatsApp, X, Facebook, Telegram, salin tautan, dan menu berbagi bawaan ponsel
- Agenda: saring menurut tipe dan bulan, halaman detail dengan tautan peta, tautan tiket, tambah ke Google Calendar, dan unduhan file `.ics`
- Direktori: venue, artis, organizer, komunitas, vendor, dengan agenda terkait di tiap profil
- Pencarian lintas berita, agenda, dan direktori
- Halaman Tentang, `sitemap.xml`, dan `robots.txt`

**CMS admin** (`/admin`)

- Berita: tulis dengan editor visual (tebal, miring, coret, judul, daftar, kutipan, tautan, gambar, video, garis pemisah, layar penuh; Ctrl+Z untuk mengurungkan, pintasan ketik seperti "## " untuk judul) atau langsung dalam Markdown, beri tagar, tempel video YouTube, simpan sebagai draf, terbitkan, atau jadwalkan
- Slide: atur slide foto dan video di bagian atas beranda
- Event, direktori, kategori berita, dan tipe event
- Iklan: tiga template dengan pratinjau langsung, jadwal tayang, hitungan klik
- Media: unggah gambar ke ImageKit dengan bilah kemajuan, lalu pilih dari pustaka saat mengisi form
- Pengguna dengan dua peran (admin dan editor) dan pengaturan situs

## Gambar, video, dan slide

**Gambar ke ImageKit.** Di menu Media atau lewat tombol "Unggah gambar" di form mana pun, browser mengirim berkas dengan axios ke `/admin/media/unggah`. Rute itu memeriksa sesi, jenis berkas (dari isi berkasnya, bukan namanya), dan ukuran (maksimal 10 MB), lalu meneruskannya ke ImageKit dengan kunci privat. Database hanya mencatat alamat dan id berkasnya. Menghapus gambar dari menu Media juga menghapusnya di ImageKit.

**Thumbnail.** Gambar kecil di admin (pustaka media, pemilih gambar, daftar berita) dibuat dari alamat asli gambar dengan parameter `?tr=w-…` milik ImageKit; bila versi kecilnya gagal dimuat, alamat aslinya dicoba. Artikel yang punya video YouTube tetapi tidak punya gambar sampul memakai gambar video itu sebagai thumbnail di kartu dan beranda. Isian video di form langsung menampilkan pratinjau begitu tautannya dikenali.

Rute Next.js membaca unggahan lewat `request.formData()`, jadi multer tidak dipakai; perannya digantikan oleh rute tersebut. Kodenya ada di `src/lib/imagekit.ts` dan `src/app/admin/(panel)/media/unggah/route.ts`.

**Video lewat tautan YouTube.** Berkas video tidak diunggah. Ada tiga tempat untuk menempel tautan YouTube:

- kolom "Video YouTube" di form artikel: video tampil di tempat gambar sampul;
- tombol "Video" di editor: tautan di baris sendiri menjadi pemutar di tengah isi artikel;
- slide berjenis video.

Bentuk `youtube.com/watch?v=…`, `youtu.be/…`, `/shorts/…`, dan `/live/…` dikenali. Tautan selain YouTube ditolak saat disimpan.

**Slide di bagian atas beranda.** Diatur dari Admin > Slide. Tiap slide berjenis foto (gambar dari ImageKit) atau video (tautan YouTube), dengan judul, keterangan, tautan tujuan, urutan, dan tombol tampil atau sembunyi. Slide berganti sendiri tiap enam detik, bisa digeser dengan jari, dan berhenti saat disorot atau saat video diputar. Bila tidak ada slide aktif, tempatnya diisi artikel utama.

## Toast, layar pembuka, dan kerangka pemuatan

- **Toast** memakai toastify-js: muncul setelah menyimpan, menghapus, mengunggah, atau menyalin tautan. Galat tampil sebagai toast dan tetap tertulis di halaman. Pembungkusnya ada di `src/lib/toast.ts`.
- **Layar pembuka** (logo dan indikator aktivitas) tampil sekitar satu detik pada kunjungan pertama dalam satu sesi browser, lalu hilang sendiri.
- **Indikator aktivitas** juga muncul di tombol Simpan dan Masuk selama form dikirim, dan di tombol unggah.
- **Kerangka pemuatan (skeleton)** tampil saat berpindah halaman publik, paling singkat satu detik. Lamanya diatur lewat `SKELETON_MS` di `.env`; isi `0` untuk mematikan jedanya. Admin memakai skeleton tanpa jeda buatan.

Catatan: jeda satu detik ini menambah waktu tunggu di setiap halaman publik. Untuk situs yang sudah tayang, pertimbangkan `SKELETON_MS=0` supaya halaman tampil secepat datanya siap.

## Iklan di header

Ruang iklan header adalah papan selebar isi halaman, kira-kira 970 × 220 di layar lebar (di ponsel selebar layar). Isinya diatur dari **Admin > Iklan**.

| Template | Isi | Cocok untuk |
| --- | --- | --- |
| Banner gambar | Satu gambar memenuhi slot | Materi jadi dari pemasang (siapkan 1940 × 440 px, perbandingan 970 × 220) |
| Teks dan tombol | Judul, satu baris keterangan, tombol | Iklan cepat tanpa desain |
| Gambar dan teks | Gambar kecil di kiri, judul dan tombol di kanan | Logo atau foto produk dengan ajakan |

Tiap iklan punya pilihan warna (kuning, gelap, polos), jadwal mulai dan selesai, serta tombol nyala dan mati. Bila beberapa iklan aktif di slot yang sama, iklan bergiliran setiap halaman dimuat. Bila tidak ada iklan aktif, slot header menampilkan ajakan pasang iklan. Slot kedua, **sela konten**, tampil di beranda dan di bawah artikel dengan template yang sama.

Komponennya: `src/components/site/AdSlot.tsx` (memilih iklan) dan `AdView.tsx` (menggambar template). Template baru ditambahkan di `AdView.tsx`, daftar `AD_TEMPLATES` di `src/lib/types.ts`, dan batasan `CHECK` kolom `template` di `db/schema.sql`.

## Tema dan warna

Ada dua tema: terang (krem hangat) dan gelap (abu hangat), dengan satu kuning datar sebagai warna penanda. Kepala situs, kaki situs, dan bilah samping admin selalu gelap di kedua tema supaya logo kuning terbaca. Pengunjung mengganti tema lewat tombol di navbar; pilihan disimpan di cookie `tema` sehingga halaman langsung tampil dengan tema yang benar. Tanpa pilihan tersimpan, situs mengikuti pengaturan perangkat. Di admin, bilah samping bisa diciutkan menjadi deretan ikon; pilihan itu diingat lewat cookie `sisi`.

Semua warna ada di bagian paling atas `src/app/globals.css` sebagai variabel CSS. `--sun` adalah kuningnya (`#ffcc00`, sama dengan logo); mengubahnya mengganti warna penanda di seluruh situs dan admin. Warna bilah samping ada di `--side` dan kawan-kawannya. Aturan tampilan terbaru ada di blok "Tampilan v4" di bagian bawah file itu.

Huruf dimuat lewat `next/font`: Poppins (huruf logo) untuk nama situs, judul artikel dan bagian, serta navbar, semuanya tebal; Marcellus (serif klasik) untuk judul halaman seperti Berita, Musik, atau Agenda; DM Sans untuk teks.

### Logo

Logo mengikuti berkas logo pemilik situs: enam batang ekualiser kuning (#FFCC00, tertinggi di tengah) dan tulisan **PROJECT / KONSER** dua baris dalam Poppins Bold, rata bawah dengan batangnya. Logo digambar sebagai SVG dan teks di `src/components/site/Logo.tsx`, jadi tetap tajam di ukuran berapa pun, dan dipakai di kepala situs, kaki situs, bilah samping admin, layar pembuka, dan halaman masuk. Di layar pembuka dan halaman masuk batangnya tumbuh satu per satu sekali saat tampil, lalu diam dalam bentuk logo yang sama persis. Tulisan dua baris diambil dari nama situs di Pengaturan (kata pertama di atas, sisanya di bawah). Ikon tab browser ada di `src/app/icon.svg` (latar transparan), dan salinan logo polos di `public/logo.svg`.

### Warna label kategori dan tipe event

Setiap kategori berita dan tipe event punya warna label sendiri. Warnanya diatur di **Admin > Kategori & label**: tekan lingkaran warna di samping nama, pilih warna, lalu Simpan. Warna itu dipakai di label kartu, di ubin beranda, dan di pencari event. Di atas latar terang label tampil sebagai versi lembut dari warnanya supaya tidak mencolok; di atas gambar label tampil penuh dengan warna teks yang dipilih otomatis agar tetap terbaca.

### Media sosial

Tautan Instagram, TikTok, Threads, YouTube, dan Facebook diisi di **Admin > Pengaturan** dan tampil sebagai ikon di baris paling atas, kaki situs, dan widget beranda. Yang dikosongkan tidak ditampilkan. Bawaannya Instagram `instagram.com/projectkonser`, TikTok `tiktok.com/@projectkonser`, Threads `threads.com/@projectkonser`, dan YouTube `youtube.com/@projectkonser`. Teks hak cipta di tengah kaki situs memakai nama situs dan tahun berjalan.

### Editor isi

Isi artikel, event, dan halaman ditulis di editor visual: teks yang ditebalkan langsung terlihat tebal, judul terlihat sebagai judul, dan Ctrl+Z (⌘Z di Mac) mengurungkan langkah terakhir, termasuk langkah dari tombol. Alatnya:

| Kelompok | Alat | Pintasan |
| --- | --- | --- |
| Riwayat | Urungkan, ulangi | Ctrl/⌘+Z, Ctrl/⌘+Shift+Z, Ctrl+Y |
| Blok | Judul (H2), subjudul (H3), kutipan | Ctrl/⌘+Alt+2, Ctrl/⌘+Alt+3; atau ketik `## `, `### `, `> ` di awal baris |
| Teks | Tebal, miring, coret, bersihkan format | Ctrl/⌘+B, Ctrl/⌘+I, Ctrl/⌘+Shift+X |
| Daftar | Daftar butir, daftar nomor | Ctrl/⌘+Shift+8, Ctrl/⌘+Shift+7; atau ketik `- `, `1. ` |
| Sisipan | Tautan, gambar dari alamat, unggah gambar, video YouTube, garis pemisah | Ctrl/⌘+K; ketik `---` lalu Enter untuk garis |
| Tampilan | Layar penuh (Esc untuk keluar), mode Markdown | |

Gambar juga bisa diseret atau ditempel langsung ke kotak isi (beberapa sekaligus); teks alternatifnya diambil dari nama file. Enter di butir daftar, judul, atau kutipan yang kosong mengembalikannya ke paragraf, dan Backspace di awal baris berformat melepas formatnya. Di bawah editor ada jumlah kata dan perkiraan waktu baca.

Isi tetap disimpan sebagai Markdown, jadi artikel lama terbuka apa adanya, dan tombol **Markdown** menampilkannya untuk disunting langsung. Yang disimpan hanya format yang dikenal situs (tabel di atas); warna huruf, ukuran huruf, atau tabel yang ditempel dari tempat lain tidak ikut, dan tempelan masuk sebagai teks polos per paragraf.

Cara kerjanya: setelah setiap ketikan, isi kotak sunting dirapikan ke bentuk baku (paragraf, judul, kutipan, daftar, video, garis), sehingga hasil browser yang berbeda-beda tidak pernah sampai ke Markdown. Karena isinya dirapikan, riwayat urungkan dikelola editor sendiri (200 langkah, ketikan beruntun digabung jadi satu langkah), bukan riwayat bawaan browser. Kodenya ada di `src/components/admin/Editor.tsx` (tombol dan peristiwa), `src/components/admin/editor-dom.ts` (perapian dan posisi kursor), dan `src/lib/richtext.ts` (penerjemah ke Markdown). Tebal, miring, dan coret masih memakai `document.execCommand` milik browser; perintah itu berstatus usang tetapi tetap didukung semua browser utama.

### Foto profil

Setelah memilih atau mengunggah foto, seret foto di dalam lingkaran untuk menggeser posisinya (atau pakai tombol panah), dan geser pengatur Perbesar sampai 300%. Posisi itu dipakai di semua tempat foto profil tampil. Tombol Ke tengah mengembalikan posisi awal.

Tiap pengguna bisa mengganti nama tampilan dan foto profilnya di **Admin > Pengguna**, bagian "Profil saya". Foto diunggah ke ImageKit seperti gambar lain, dan tampil di bilah samping admin, daftar pengguna, serta di samping nama penulis pada artikel.

## Fitur admin tambahan

| Menu | Isi |
| --- | --- |
| **Kotak masuk** | Pengajuan event dari `/kirim-event` serta pesan dan permintaan iklan dari `/kontak`. Pengajuan event punya tombol "Setujui jadi event" yang membuat draf event dari isinya; admin tinggal memeriksa lalu menerbitkan. Judul tiap kiriman bisa diklik untuk membaca isinya utuh; dari sana balasan dibuka di tab baru lewat Gmail (atau lewat aplikasi email perangkat), lalu kiriman ditandai selesai. Halaman `/kirim-event` tidak ada di menu bawaan; tautkan dari Menu & teks berjalan atau bagikan alamatnya bila ingin menerima pengajuan. |
| **Iklan > Laporan** | Tayangan, klik, dan rasio klik per iklan untuk 7, 30, atau 90 hari, diagram per hari, dan unduhan CSV per iklan untuk dikirim ke pemasang. Tayangan dihitung sejak fitur ini dipasang. |
| **Berita (form artikel)** | Judul dan deskripsi untuk mesin pencari dengan pratinjau hasil pencarian; status "Tinjau"; catatan untuk peninjau; tautan pratinjau draf; riwayat perubahan dengan tombol kembalikan. |
| **Halaman** | Halaman tetap (Kebijakan Privasi, Pedoman Media Siber, Redaksi) yang dibuka di `/halaman/alamat`. Halaman terbit bisa ditautkan dari kaki situs dan dari menu navbar. |
| **Menu & teks berjalan** | Isi dan urutan menu navbar, serta isi teks berjalan: otomatis (enam berita terbaru) atau pilihan sendiri, termasuk teks bebas, dan kecepatannya. Hanya admin. |
| **Buletin** | Daftar email dari kotak langganan di kaki situs, dengan unduhan CSV. Situs ini tidak mengirim email; daftar itu diimpor ke layanan email pilihan Anda. |
| **Riwayat** | Siapa melakukan apa di admin, 200 kejadian terakhir. |

Beberapa hal yang perlu diketahui:

- **Peran.** Akun berperan penulis (editor) tidak bisa menerbitkan sendiri: pilihan "Terbit" disimpan sebagai "Menunggu tinjauan" sampai admin menerbitkannya. Dua akun bawaan sama-sama admin, jadi aturan ini baru terasa bila Anda menambah akun penulis di menu Pengguna.
- **Tautan pratinjau draf** membuka artikel bagi siapa pun yang memegangnya, tanpa perlu masuk. "Buat ulang" atau "Matikan tautan" langsung membuat tautan lama tidak berlaku.
- **Riwayat perubahan** menyimpan 20 versi terakhir judul, ringkasan, dan isi tiap artikel. Gambar sampul, kategori, dan tagar tidak ikut diversikan.
- **Form publik** dilindungi isian jebakan untuk robot dan batas lima kiriman per sepuluh menit per alamat IP. Batas itu disimpan di memori server, jadi kembali nol saat server dijalankan ulang.

## Blok kategori dan video YouTube di beranda

Kategori berita ada empat: **Liputan Event, Musik, Film, Press Release** (urutan ini juga dipakai di menu Berita). `npm run db:setup` menyesuaikan database lama sekali saja: Liputan menjadi Liputan Event, Siaran Pers menjadi Press Release, dan artikel di kategori contoh Gaya Hidup dipindah ke Liputan Event. Kategori yang Anda ubah atau tambah sendiri setelah itu tidak disentuh lagi.

Judul besar di bagian atas beranda dihapus. Sebagai gantinya, tiap kategori punya blok sendiri di bawah beranda: judul kategori bergaya judul halaman (serif klasik dengan garis kuning), artikel utama (gambar, penulis, waktu, ringkasan, tombol **Baca selengkapnya** yang transparan), enam artikel kecil, tombol **Sebelumnya / Berikutnya** (sampai tiga halaman), dan tautan **Baca selengkapnya di (kategori)** ke daftar lengkapnya.

Di bawah tiap blok bisa tampil pemutar YouTube dengan daftar video di sampingnya. Isi di **Admin > Kategori & label**, bagian "Video YouTube di beranda" pada baris kategori:

- satu tautan playlist (`https://www.youtube.com/playlist?list=…`) atau kanal (`https://www.youtube.com/channel/UC…`), atau
- beberapa tautan video, satu per baris (paling banyak 15),
- ditambah judul daftar, misalnya "Musik Week 31" atau "Trailer".

**Otomatis untuk Musik dan Film.** Bila `YOUTUBE_API_KEY` terpasang dan isian YouTube kategori Musik atau Film dikosongkan, videonya diambil otomatis: Musik dari video musik terpopuler di Indonesia (judul "Musik Week" + nomor pekan), Film dari trailer film Indonesia 90 hari terakhir (judul "Trailer"). Disimpan tiga jam. Ketik `mati` di isian untuk menyembunyikan video kategori itu. Kuota: Musik memakai 1 unit dan Film sekitar 101 unit tiap pengambilan, jauh di bawah jatah gratis 10.000 unit per hari.

Di Admin > Kategori & label terlihat apakah kunci API terpasang, berapa video yang terambil per kategori dan lewat jalur apa (Data API atau RSS), pesan galat dari YouTube bila ada (misalnya kunci salah atau kuota habis), serta tombol **Ambil ulang dari YouTube** untuk mengosongkan simpanan.

Di form kategori, bagian "Video YouTube di beranda" punya empat pilihan sumber: **Otomatis** (khusus Musik dan Film), **Video satu per satu** (tempel satu atau beberapa tautan sekaligus, atur urutan dengan tombol naik/turun, maksimal 15), **Satu playlist** (pilih langsung dari daftar playlist kanal YouTube situs, yaitu alamat YouTube di Admin > Pengaturan, atau tempel tautan playlist), dan **Mati**. Daftar playlist kanal butuh `YOUTUBE_API_KEY`.

Isian diperiksa saat disimpan: baris yang bukan tautan YouTube, campuran playlist dan video, atau lebih dari 15 video ditolak dengan pesan yang jelas. Dikosongkan berarti video kategori itu disembunyikan.

Judul dan tanggal video diambil dari umpan RSS YouTube (playlist/kanal) dan oEmbed (video satuan), keduanya tanpa kunci API, lalu disimpan di memori satu jam. Durasi video (05:29 dan seterusnya) hanya tersedia lewat YouTube Data API: isi `YOUTUBE_API_KEY` di `.env` bila ingin menampilkannya. Pemutar baru dimuat setelah diklik supaya beranda tetap ringan. Bila YouTube sedang tidak bisa dihubungi, playlist tetap bisa diputar lewat pemutar playlist bawaan YouTube.

## Backup & Restore

Menu **Admin > Backup & Restore** (khusus admin, alamat `/admin/cadangan`). Kotak Backup dan Restore tampil berdampingan:

- **Backup**: tombol "Backup sekarang" mengunduh satu berkas `.json` yang tersusun rapi: info berkas di atas, lalu ringkasan jumlah baris, daftar kolom, dan isi tiap tabel dengan satu baris data per baris teks, urut dari pengaturan dan pengguna sampai riwayat. Bagian "Susunan berkas backup" di halaman itu menampilkan urutan dan jumlah baris tiap tabel, plus tombol **Unduh template** (susunan yang sama tanpa isi, tidak bisa di-restore). Berkas berisi berisi semua tabel isi situs (artikel, event, direktori, iklan, kategori, halaman, pengguna, pengaturan, kotak masuk, buletin, trafik, riwayat). Sesi masuk tidak ikut. Berkas memuat sidik SHA-256 dari isinya. Gambar tetap di ImageKit dan tidak ikut dalam berkas.
- **Pengingat**: pilih Mati, Harian, Mingguan (bawaan), Bulanan, atau Tahunan. Bila sudah waktunya, pita pengingat muncul di atas setiap halaman admin (dengan tombol Unduh cadangan dan "Ingatkan besok") dan menu Cadangan diberi tanda "!". Pengingat hilang begitu cadangan diunduh.
- **Restore**: pilih atau seret berkas backup ke kotak Restore, ketik PULIHKAN, centang, lalu tekan Restore. Ini mengganti seluruh isi situs dengan isi berkas. Pemeriksaan sebelum memulihkan (semuanya di halaman Cadangan, tanpa perlu memasukkan kata sandi lagi): berkas berakhiran .json dan paling besar 50 MB, kalimat PULIHKAN diketik, pernyataan sudah mengunduh cadangan terbaru dicentang, kiriman berasal dari halaman admin situs ini, isi berupa cadangan Project Konser dari versi yang sama atau lebih lama, sidik SHA-256 cocok (berkas tidak diubah atau terpotong), semua tabel dan kolom dikenal database, jumlah baris sesuai, dan ada paling sedikit satu akun admin. Pemulihan berjalan dalam satu transaksi: bila gagal di tengah, semuanya dibatalkan. Setelah berhasil, Anda tetap masuk dan kembali ke halaman Cadangan (sesi masuk dikembalikan ke akun dengan email yang sama).
- **Riwayat**: setiap unduhan dan pemulihan tercatat (waktu, siapa, isi, ukuran, sidik).

Berkas cadangan berisi email pengguna dan hash kata sandi. Simpan di tempat pribadi yang aman.

## Trafik pengunjung

Data trafik bisa diekspor sebagai CSV dari halaman Trafik: per hari (tanggal, tayangan, pengunjung) sesuai rentang 7/30/90 hari, halaman teramai, dan artikel paling banyak dibaca.

Menu **Admin > Trafik** menampilkan tayangan halaman dan jumlah pengunjung hari ini, 7 hari, dan 30 hari, diagram batang per hari (rentang 7, 30, atau 90 hari, dengan tabel di bawahnya), halaman teramai, dan artikel paling banyak dibaca. Dua angka pertamanya juga ada di Dasbor.

Cara kerjanya: setiap kali pengunjung membuka halaman, browsernya memanggil `/kunjungan` (`src/app/kunjungan/route.ts`). Yang disimpan hanya hitungan harian per halaman (tabel `page_views`) dan sidik harian pengunjung (tabel `visitors`: hash dari tanggal, alamat IP, dan jenis browser). Alamat IP sendiri tidak disimpan, dan sidik dihapus setelah 90 hari. Robot tidak dihitung. Di situs yang sudah tayang (`npm run build` lalu `npm run start`), kunjungan admin yang sedang masuk juga tidak dihitung; saat pengembangan (`npm run dev`) tetap dihitung supaya laporannya bisa dicoba sendiri.

Halaman Trafik, Laporan iklan, dan Dasbor menyegarkan datanya sendiri tiap 10 sampai 20 detik selama tabnya terbuka, jadi angka dan diagramnya mengikuti kunjungan yang baru masuk tanpa perlu memuat ulang. Angka "dibaca" tiap artikel bertambah setiap kali halaman artikelnya dibuka.

"Pengunjung" berarti pengunjung berbeda per hari. Orang yang sama datang dua hari dihitung dua kali pada angka 7 dan 30 hari, karena itu di sana ditulis "kunjungan harian". Bila situs dipasang di belakang proxy, pastikan proxy meneruskan header `x-forwarded-for`; tanpa itu semua pengunjung dengan browser yang sama terhitung sebagai satu.

## Halaman artikel

- **Waktu terbit** tampil sebagai "Terbit 12 menit lalu, 8 Oktober 2026 pukul 09.15 WIB". Waktunya diatur di form artikel, isian **Waktu terbit (WIB)**: kosongkan untuk terbit saat disimpan, isi waktu depan untuk menjadwalkan, atau waktu lampau untuk memundurkan tanggal.
- **Pembuka artikel** berupa gambar sampul penuh dengan remah roti, label, judul, dan penulis di atasnya. Gambarnya membesar pelan saat halaman dibuka dan bergeser lebih lambat dari halaman saat digulir (paralaks); panah di pojok kanan bawah menggulir ke isi.
- **Bagikan** berupa tujuh ikon: WhatsApp, X, Facebook, Telegram, Instagram, Threads, dan salin tautan. Instagram tidak menyediakan alamat web untuk membagikan tautan, dan situs lain tidak bisa mengisi pesan Instagram secara otomatis. Karena itu ikon Instagram bekerja begini: di ponsel dan tablet, menu berbagi bawaan perangkat yang terbuka, dan Instagram (Direct maupun Story) ada di sana; di komputer, tautan langsung disalin lalu muncul panel petunjuk dengan tombol **Buka Instagram Direct** (tab baru) dan tiga langkah: pilih penerima, tempel (⌘V/Ctrl+V), kirim. Menu berbagi bawaan macOS dan Windows sengaja tidak dipakai di komputer, karena Instagram tidak ada di dalamnya.
- **Berita terkait** di bawah artikel mendahulukan artikel dengan tagar yang sama, lalu kategori yang sama, lalu yang terbaru.

## Widget kalender dan cuaca

- **Kalender event** menampilkan satu bulan penuh. Tanggal yang punya event ditandai; menekannya menampilkan event hari itu, dan panah berpindah bulan. Datanya dari tabel event, enam bulan ke depan.
- **Cuaca** mengambil data dari Open-Meteo (gratis, tanpa kunci API) lewat axios dan menyimpannya di memori selama 30 menit. Kota diatur lewat `WEATHER_CITY`, `WEATHER_LAT`, dan `WEATHER_LON` di `.env`. Ikon dan keterangannya mengikuti waktu WIB: pagi (04.00–10.00), siang (10.00–15.00), sore (15.00–18.00), dan malam; pada malam hari ikon matahari diganti bulan. Ikonnya bergerak pelan (sinar berputar, awan bergeser, hujan menetes), dan suhu di widget menghitung naik saat tampil. Bila layanannya tidak bisa dihubungi, widget menampilkan pesan dan halaman tetap jalan.

## Gerak

Geraknya sengaja pelan dan halus:

- Isi halaman memudar masuk saat dimuat dan setiap berpindah halaman
- Bagian di bawah layar muncul perlahan saat digulir masuk
- Logo ekualiser bergerak di layar pembuka; halaman masuk admin berlatar batang ekualiser yang naik turun di belakang kartu kaca tembus pandang
- Bilah samping admin melebar dan menciut dengan mulus
- Ganti tema memudar silang dari tema lama ke tema baru
- Teks berjalan dengan kategori berwarna dan umur tiap berita, tepi yang memudar, dan titik "siaran" yang berdenyut; berhenti saat disorot
- Hitung mundur tiap detik, garis tipis di tepi atas saat berpindah halaman

Pengunjung yang mengaktifkan "kurangi gerakan" di perangkatnya tidak mendapat animasi ini. Pengaturnya ada di `src/components/site/MotionRoot.tsx` dan bagian "Gerak" di `globals.css`.

## Susunan folder

```
db/schema.sql              Skema database
scripts/setup-db.mjs       Membuat tabel, admin, dan data contoh
scripts/seed-data.mjs      Isi data contoh
src/app/(situs)/           Halaman publik
src/app/admin/             Halaman CMS
src/app/go/[id]/           Mencatat klik iklan lalu meneruskan
src/components/site/       Komponen situs
src/components/admin/      Komponen CMS
src/lib/queries.ts         Semua query baca
src/lib/actions/           Server Actions untuk menyimpan dan menghapus
src/lib/auth.ts            Sesi, hash kata sandi, pemeriksaan peran
src/lib/imagekit.ts        Unggah dan hapus berkas di ImageKit (axios)
src/lib/youtube.ts         Mengenali tautan YouTube
src/lib/toast.ts           Toast (toastify-js)
src/lib/skeleton.ts        Jeda minimum kerangka pemuatan
```

Catatan teknis:

- **Tanpa ORM.** Query ditulis sebagai SQL biasa lewat `pg`, dikumpulkan di `src/lib/queries.ts`.
- **Gambar disimpan di ImageKit.** Tabel `media` hanya mencatat alamat dan id berkas. Alamat ImageKit otomatis diminta dalam lebar yang pas (`?tr=w-…`) supaya halaman ringan.
- **Halaman tidak ditemukan** pada rute yang memakai skeleton dijawab dengan status 200 dan tanda `noindex`, karena kerangka sudah terkirim lebih dulu. Ini perilaku bawaan Next.js saat memakai `loading.tsx`.
- **Waktu** disimpan sebagai `timestamptz` dan selalu ditampilkan serta dimasukkan dalam WIB.
- **Isi artikel** ditulis dalam Markdown. HTML mentah tidak pernah dirender.
- **Sesi** disimpan di tabel `sessions` sebagai hash; cookie berlaku tujuh hari.
- Pembatas percobaan masuk disimpan di memori proses, jadi berlaku per server.

## Keamanan

- Semua halaman dan aksi admin memeriksa sesi masuk; Pengaturan, Menu & teks berjalan, Pengguna (tambah/hapus), dan Backup & Restore khusus admin.
- Isi artikel ditulis sebagai Markdown dan selalu di-escape: HTML mentah dan tautan `javascript:` tidak pernah ikut tampil.
- Unggah gambar dan restore hanya menerima kiriman dari situs sendiri; unduh backup ditolak bila dipicu situs lain.
- `next.config.ts` memasang header keamanan (nosniff, larangan dibingkai situs lain, Referrer-Policy, Permissions-Policy, HSTS) dan `noindex` untuk /admin.
- Batas percobaan masuk dan batas kiriman form publik disimpan di memori server: kembali nol saat server dijalankan ulang, dan tidak berbagi antar-server bila situs dijalankan di beberapa server sekaligus.

## Memasang ke server

1. Siapkan PostgreSQL dan isi `DATABASE_URL`. Untuk layanan cloud, tambahkan `?sslmode=require`.
2. Isi `SITE_URL` dengan alamat situs, misalnya `https://situsanda.id`, dan `IMAGEKIT_PRIVATE_KEY`.
3. Jalankan `npm run db:setup -- --tanpa-contoh` sekali.
4. Jalankan `npm run build` lalu `npm start`, atau pasang ke layanan yang mendukung Next.js.

## Status pengujian

Proyek ini ditulis di lingkungan yang tidak bisa mengunduh paket npm dan tidak bisa menghubungi ImageKit maupun YouTube, sehingga **belum pernah dijalankan dengan Next.js, axios, toastify-js, dan ImageKit yang sebenarnya**. Yang sudah diuji dengan pengganti:

- Skema, skrip setup (termasuk menyesuaikan database versi sebelumnya), dan semua query dijalankan di PostgreSQL 16
- Semua Server Action dan route handler dijalankan ke database: masuk, hak akses, simpan, jadwal, tagar, slide, tautan YouTube, unggah, hapus, klik iklan, file kalender, kotak masuk, profil, cadangan (unduh, validasi berkas, pulihkan, pengingat), video YouTube per kategori (220 pemeriksaan)
- Setiap halaman dirender tanpa galat lewat server pengganti dan diperiksa tidak meluber di lebar ponsel; halaman utama dilihat lewat tangkapan layar Chromium dalam tema terang dan gelap
- Bagian interaktif dicoba di browser: layar pembuka, skeleton, slide, kalender, cuaca, navbar, logo, bilah samping admin (ciut, laci di ponsel), halaman masuk, ukuran gambar artikel, thumbnail dan pratinjau video, ikon media sosial, warna label, ukuran iklan header, pemutar video, tagar, toast, unggah, ganti tema, editor (format, pintasan ketik, urungkan/ulangi, tempel, layar penuh), bagikan ke Instagram di komputer dan ponsel, kotak masuk, trafik langsung, pratinjau iklan, logo, blok kategori dan pemutar YouTube, halaman Cadangan (166 pemeriksaan)
- Pemeriksaan TypeScript lolos dengan tipe pengganti untuk `next`, `react`, `pg`, dan `axios`

Yang memakai tiruan dan perlu dicoba dengan yang asli:

- **ImageKit.** Unggah dan hapus diuji terhadap tiruan yang meniru jawaban ImageKit. Alamat dan cara autentikasinya ditulis mengikuti dokumentasi ImageKit, tetapi belum pernah dikirim ke server ImageKit. Coba unggah satu gambar setelah mengisi kunci.
- **axios dan toastify-js.** Diuji dengan tiruan sederhana yang punya bentuk panggilan sama.
- **Form yang mengirim data.** Server pengganti di lingkungan uji tidak menjalankan Server Action dari form di browser. Semua aksi (kirim event, setujui, simpan menu, buletin, dan lainnya) diuji langsung ke database; di browser yang diperiksa adalah tampilan dan perilaku halamannya.
- **Skeleton.** Jeda satu detiknya terukur, tetapi tampilan skeleton saat berpindah halaman bergantung pada `loading.tsx` milik Next.js, yang tidak bisa dijalankan di sini.
- **Cuaca.** Diuji terhadap tiruan jawaban Open-Meteo; belum pernah memanggil layanan aslinya.
- **YouTube.** Pemutar, gambar pratinjau, umpan RSS, dan oEmbed tidak bisa dihubungi dari lingkungan uji. Yang diperiksa adalah alamat pemutar yang dihasilkan dan pembacaan umpan RSS dari contoh tiruan; YouTube Data API (durasi) belum pernah dipanggil sungguhan.

Bila langkah pertama memunculkan galat, kemungkinan terbesarnya ada di tempat ini:

- **Huruf.** `src/app/layout.tsx` memuat Poppins, Marcellus, dan DM Sans lewat `next/font`, yang butuh internet saat pertama dijalankan. Di lingkungan uji kedua huruf ini diganti huruf lain yang mirip, jadi bentuk huruf di situs asli sedikit berbeda dari tangkapan layar.
- **Versi.** `package.json` meminta Next 16. Kode hanya memakai API yang juga ada di Next 15 (`params` dan `cookies()` yang di-`await`, Server Actions), jadi menurunkan ke `next@15` aman bila perlu.
- **Tipe toastify-js.** Tipenya ditulis sendiri di `src/types/toastify-js.d.ts`, sebatas opsi yang dipakai.

## Belum termasuk

Komentar pembaca, notifikasi push, pengiriman buletin lewat email (yang ada baru pengumpulan alamatnya), tindakan massal di daftar berita, galeri foto event, dan cadangan database dari admin belum dibuat.
