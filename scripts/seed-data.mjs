// Data contoh untuk mengisi situs saat pertama dipasang.
// Semua nama band, film, acara, dan tempat di sini fiktif.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Waktu sekian jam yang lalu. */
const hoursAgo = (hours) => new Date(Date.now() - hours * HOUR);

/** Tanggal sekian hari dari hari ini pada jam tertentu WIB. */
function at(daysFromNow, time = "00:00") {
  const wibNow = new Date(Date.now() + 7 * HOUR + daysFromNow * DAY);
  const day = wibNow.toISOString().slice(0, 10);
  return new Date(`${day}T${time}:00+07:00`);
}

export const categories = [
  { name: "Liputan Event", slug: "liputan-event", sort: 1, color: "#3f7c8c" },
  { name: "Musik", slug: "musik", sort: 2, color: "#e2478b" },
  { name: "Film", slug: "film", sort: 3, color: "#ec8b2c" },
  { name: "Press Release", slug: "press-release", sort: 4, color: "#7c8b4e" },
];

export const eventTypes = [
  { name: "Konser", slug: "konser", sort: 1, color: "#f2c230" },
  { name: "Festival", slug: "festival", sort: 2, color: "#c9694a" },
  { name: "Pameran", slug: "pameran", sort: 3, color: "#3f7c8c" },
  { name: "Pentas Seni", slug: "pentas-seni", sort: 4, color: "#8a5a83" },
  { name: "MICE", slug: "mice", sort: 5, color: "#55629b" },
  { name: "Kompetisi", slug: "kompetisi", sort: 6, color: "#3e7a5e" },
  { name: "Bazar", slug: "bazar", sort: 7, color: "#7c8b4e" },
];

export const posts = [
  {
    title: "Senja Listrik buka tur sepuluh kota dari Bandung",
    category: "musik",
    featured: true,
    published_at: hoursAgo(3),
    views: 1840,
    excerpt:
      "Kuartet asal Bandung itu memulai tur terpanjang mereka di Gudang Sembilan, lalu bergerak ke timur sampai Malang.",
    body: `Senja Listrik memulai tur sepuluh kota mereka akhir pekan ini di Gudang Sembilan, Bandung. Tur ini menjadi yang terpanjang sejak band itu berdiri tujuh tahun lalu, dengan jadwal yang membentang dari Bandung sampai Malang.

## Daftar lagu baru di tiap kota

Vokalis Dimas Ardhana mengatakan setiap kota akan mendapat susunan lagu yang berbeda. Separuh daftar lagu diambil dari album ketiga yang belum dirilis.

> Kami ingin orang yang datang dua kali tetap pulang membawa cerita yang lain.

Band pembuka juga berganti di setiap kota dan dipilih dari kiriman demo yang masuk sepanjang bulan lalu.

## Yang perlu dicatat penonton

- Pintu dibuka pukul 18.30, pertunjukan mulai 19.30
- Tiket dijual per kota, tidak ada tiket terusan
- Penonton di bawah 15 tahun wajib didampingi

Jadwal lengkap dan tautan tiket tiap kota ada di [halaman agenda](/event).`,
  },
  {
    title: "Orkes Pagi Buta rilis album kedua yang direkam di gudang kopi",
    category: "musik",
    published_at: hoursAgo(7),
    views: 920,
    excerpt:
      "Sebelas lagu direkam langsung dalam tiga malam, lengkap dengan suara hujan di atap seng yang sengaja tidak dibuang.",
    body: `Orkes Pagi Buta merilis album kedua mereka, *Sebelum Ayam Berkokok*, hari ini. Sebelas lagu di dalamnya direkam langsung selama tiga malam di sebuah gudang kopi di pinggir Jakarta.

Peniup terompet Laras Hadi menyebut ruangan itu dipilih karena gaungnya. Suara hujan di atap seng pada lagu keempat sengaja tidak dibuang saat proses pencampuran.

## Dari enam orang menjadi sembilan

Formasi orkes ini bertambah tiga pemain sejak album pertama: dua pemain gesek dan satu pemain akordeon. Hasilnya terdengar di lagu pembuka yang berdurasi hampir tujuh menit.

Album tersedia di layanan streaming mulai hari ini. Versi kaset dicetak 300 keping dan dijual di pesta rilis.`,
  },
  {
    title: "Film Lampu Kota Padam tayang bulan depan, cerita satu malam tanpa listrik",
    category: "film",
    published_at: hoursAgo(12),
    views: 1310,
    excerpt:
      "Drama berdurasi 104 menit ini mengikuti empat orang asing yang terjebak di halte ketika seluruh kota gelap.",
    body: `Rumah produksi Tepi Layar mengumumkan jadwal tayang *Lampu Kota Padam*, film panjang kedua sutradara Nadia Prameswari. Film berdurasi 104 menit ini masuk bioskop bulan depan.

Ceritanya berlangsung dalam satu malam. Empat orang asing terjebak di sebuah halte ketika listrik seluruh kota padam, dan masing-masing membawa alasan sendiri untuk tidak pulang.

## Diambil tanpa lampu tambahan

Sebagian besar adegan diambil hanya dengan cahaya senter, lilin, dan lampu kendaraan yang lewat. Penata kamera Bayu Seno mengatakan keputusan itu membuat jadwal syuting mundur dua minggu.

> Gelapnya harus terasa seperti gelap yang kita kenal saat mati lampu di rumah.

Cuplikan resmi dirilis pekan ini bersama poster pertama.`,
  },
  {
    title: "Tiga panggung, satu lapangan: catatan dari Gema Raya Fest tahun lalu",
    category: "liputan-event",
    published_at: hoursAgo(26),
    views: 2210,
    excerpt:
      "Menjelang edisi baru, kami membuka lagi catatan dari lapangan: antrean, tata suara, dan satu penampil yang mencuri malam.",
    body: `Gema Raya Fest kembali akhir pekan ini. Sebelum gerbang dibuka, kami membuka lagi catatan liputan dari edisi tahun lalu untuk melihat apa yang berjalan baik dan apa yang perlu diperbaiki.

## Antrean masuk

Gerbang utama sempat padat selama satu jam pertama. Panitia tahun ini menjanjikan dua gerbang tambahan di sisi timur dan penukaran gelang sejak sehari sebelumnya.

## Tata suara

Tiga panggung di satu lapangan berarti suara saling bocor. Tahun lalu panggung kecil paling dirugikan. Jadwal tahun ini disusun bergantian supaya dua panggung yang berdekatan tidak berbunyi bersamaan.

## Penampil yang mencuri malam

Bukan penampil utama, melainkan Rana Wibisana yang tampil pukul lima sore di panggung kecil. Penonton yang semula duduk di rumput berdiri pada lagu ketiga dan tidak duduk lagi.`,
  },
  {
    title: "Pasar Malam Suara umumkan 24 penampil gelombang pertama",
    category: "press-release",
    published_at: hoursAgo(36),
    views: 760,
    excerpt:
      "Festival dua hari di Semarang itu memadukan panggung musik dengan lapak makanan dan wahana pasar malam.",
    body: `Penyelenggara Pasar Malam Suara mengumumkan 24 nama pertama yang akan tampil di festival dua hari mereka di Taman Kota Lama, Semarang.

Daftar itu mencakup Senja Listrik, Orkes Pagi Buta, dan Kolektif Bising Tetangga. Gelombang kedua diumumkan dua minggu lagi.

## Bukan hanya panggung

Sesuai namanya, festival ini digelar dengan suasana pasar malam. Selain dua panggung musik, pengunjung akan menemukan:

- 40 lapak makanan dari pedagang setempat
- Komidi putar dan bianglala kecil
- Lapak rilisan fisik dan cendera mata band

Tiket harian dan tiket terusan dijual mulai pekan ini.`,
  },
  {
    title: "Kapal Kertas Tenggelam pamit lewat konser terakhir di Yogyakarta",
    category: "musik",
    published_at: hoursAgo(50),
    views: 3120,
    excerpt:
      "Setelah empat belas tahun dan lima album, trio itu memilih berhenti di kota tempat mereka pertama kali manggung.",
    body: `Kapal Kertas Tenggelam mengumumkan konser terakhir mereka. Trio yang berdiri empat belas tahun lalu itu akan menutup perjalanan di Yogyakarta, kota tempat mereka pertama kali naik panggung.

Pengumuman disampaikan lewat surat pendek yang ditandatangani ketiga personel. Tidak ada perselisihan, tulis mereka, hanya keinginan untuk berhenti selagi masih senang memainkannya.

## Lima album dalam satu malam

Konser dirancang berdurasi tiga jam dengan lagu dari kelima album, dimainkan berurutan sesuai tahun rilis. Beberapa mantan pemain tambahan akan ikut naik panggung.

> Kami mulai bertiga di kamar kos. Kami ingin selesai bertiga juga, hanya ruangannya lebih besar.

Tiket dijual dalam satu kategori harga.`,
  },
  {
    title: "Dokumenter Tukang Sound ikuti kru panggung keliling Jawa",
    category: "film",
    published_at: hoursAgo(62),
    views: 540,
    excerpt:
      "Selama delapan bulan, kamera mengikuti enam kru tata suara dari satu hajatan ke hajatan berikutnya.",
    body: `*Tukang Sound* adalah dokumenter berdurasi 78 menit tentang orang-orang yang jarang terlihat di sebuah pertunjukan. Selama delapan bulan, sutradara Yoga Pratama mengikuti enam kru tata suara dari satu acara ke acara berikutnya di Pulau Jawa.

Film ini tidak memakai narator. Penonton diajak duduk di bak truk, menunggu hujan reda, dan mendengar kru berdebat soal letak pengeras suara.

## Tayang keliling

Alih-alih masuk bioskop, film ini diputar keliling di ruang komunitas. Setiap pemutaran diikuti obrolan dengan kru yang tampil di film.

Jadwal pemutaran diumumkan lewat Klub Nonton Tepi Kota.`,
  },
  {
    title: "Lima hal yang perlu disiapkan sebelum festival musim hujan",
    category: "liputan-event",
    published_at: hoursAgo(74),
    views: 1650,
    excerpt:
      "Lapangan becek tidak harus merusak akhir pekan. Ini daftar pendek dari penonton yang sudah sering kehujanan.",
    body: `Musim festival bertepatan dengan musim hujan. Lapangan becek tidak harus merusak akhir pekan asalkan Anda berangkat dengan persiapan.

1. Jas hujan ponco, karena payung menghalangi pandangan orang di belakang
2. Sepatu yang rela kotor, sebaiknya bersol tebal
3. Kantong kedap air untuk ponsel dan dompet
4. Kaus kaki cadangan di dalam tas
5. Uang tunai secukupnya untuk berjaga saat sinyal hilang

## Soal pulang

Pesan kendaraan sebelum penampil terakhir selesai. Setelah hujan, permintaan melonjak dan titik jemput sering dipindah. Tanyakan lokasi titik jemput ke petugas sejak Anda datang.`,
  },
  {
    title: "Malam akustik di Teras Atap Kala penuh sejak pintu dibuka",
    category: "liputan-event",
    published_at: hoursAgo(98),
    views: 480,
    excerpt:
      "Delapan puluh kursi terisi dalam dua puluh menit. Tiga penampil bergantian tanpa pengeras suara besar.",
    body: `Teras Atap Kala hanya punya delapan puluh kursi, dan semuanya terisi dua puluh menit setelah pintu dibuka. Malam akustik bulanan di Yogyakarta itu kini memasuki tahun ketiga.

Tiga penampil bergantian naik ke panggung setinggi satu jengkal. Tanpa pengeras suara besar, penonton memilih diam sehingga suara gelas pun terdengar.

## Aturan yang tidak tertulis

Tidak ada larangan resmi, tetapi nyaris tidak ada yang mengangkat ponsel. Pengelola hanya memasang satu papan kecil di tangga: simpan dulu, dengarkan dulu.

Edisi berikutnya sudah masuk [agenda](/event).`,
  },
  {
    title: "Rana Wibisana kembali dengan single setelah tiga tahun diam",
    category: "musik",
    published_at: hoursAgo(122),
    views: 2870,
    excerpt:
      "Lagu berjudul Pulang Lewat Belakang itu ditulis di kereta malam dan direkam dalam sekali ambil.",
    body: `Rana Wibisana merilis *Pulang Lewat Belakang*, single pertamanya dalam tiga tahun. Lagu berdurasi empat menit itu ditulis di kereta malam dan direkam dalam sekali ambil.

Ia mengaku sempat tidak menyentuh gitar selama setahun penuh. Lagu ini menjadi yang pertama ia selesaikan setelah masa itu.

> Saya tidak sedang kembali ke mana-mana. Saya hanya menulis lagi.

Belum ada kabar soal album. Rana dijadwalkan tampil di beberapa festival akhir tahun ini.`,
  },
  {
    title: "Balai Rona buka jadwal sewa gedung untuk komunitas tahun depan",
    category: "press-release",
    published_at: hoursAgo(146),
    views: 310,
    excerpt:
      "Dua belas akhir pekan disisihkan dengan tarif khusus bagi komunitas seni yang belum berbadan hukum.",
    body: `Pengelola Balai Rona membuka pendaftaran sewa gedung untuk tahun depan. Dua belas akhir pekan disisihkan dengan tarif khusus bagi komunitas seni, termasuk yang belum berbadan hukum.

## Cara mendaftar

- Kirim rencana acara satu halaman
- Sebutkan perkiraan jumlah penonton
- Pilih dua tanggal cadangan

Pendaftaran ditutup akhir bulan depan. Daftar komunitas terpilih diumumkan dua minggu setelahnya. Profil gedung ada di [direktori](/direktori/balai-rona).`,
  },
  {
    title: "Festival Film Pendek Tepi Kota terima karya sampai akhir bulan",
    category: "film",
    published_at: hoursAgo(170),
    views: 690,
    excerpt:
      "Tahun ini ada kategori baru untuk film yang dibuat dengan ponsel, tanpa batasan tema.",
    body: `Festival Film Pendek Tepi Kota menerima kiriman karya sampai akhir bulan ini. Festival yang digelar di Malang itu memasuki penyelenggaraan keenam.

Ada tiga kategori: fiksi, dokumenter, dan kategori baru untuk film yang seluruhnya dibuat dengan ponsel. Durasi maksimal dua puluh menit dan tidak ada batasan tema.

## Juri dan hadiah

Lima juri berasal dari kalangan pembuat film, kritikus, dan pengelola ruang putar. Pemenang tiap kategori mendapat dana produksi untuk film berikutnya.`,
  },
  {
    title: "Naik kereta ke konser: rute malam yang sering terlewat",
    category: "liputan-event",
    published_at: hoursAgo(218),
    views: 1240,
    excerpt:
      "Kereta terakhir sering berangkat sebelum lagu penutup. Ini cara menyiasatinya tanpa melewatkan encore.",
    body: `Kereta terakhir sering berangkat sebelum lagu penutup dimainkan. Banyak penonton akhirnya memilih pulang lebih awal atau membayar mahal untuk kendaraan daring.

## Cek jadwal sebelum membeli tiket

Bandingkan jam selesai acara dengan kereta terakhir dari stasiun terdekat. Sisakan empat puluh menit untuk keluar dari area dan berjalan kaki.

## Pertimbangkan stasiun kedua

Stasiun terdekat biasanya paling padat. Stasiun berikutnya yang berjarak lima belas menit jalan kaki sering lebih lengang, dan keretanya sama.

## Pulang berombongan

Beberapa komunitas penonton mengatur rombongan pulang untuk acara besar. Kabar seperti ini biasanya beredar seminggu sebelum acara.`,
  },
  {
    title: "Kolektif Bising Tetangga rilis kompilasi 12 band kamar",
    category: "musik",
    published_at: hoursAgo(266),
    views: 430,
    excerpt:
      "Semua lagu direkam di kamar tidur masing-masing band, lalu disatukan dalam satu kaset berdurasi 46 menit.",
    body: `Kolektif Bising Tetangga merilis kompilasi berisi dua belas band yang semuanya merekam di kamar tidur. Hasilnya adalah kaset berdurasi 46 menit berjudul *Maaf Berisik*.

Kolektif asal Bandung ini berdiri dari grup percakapan antarkos. Mereka saling meminjamkan mikrofon, kartu suara, dan sesekali pemain drum.

Kaset dijual di lapak mereka pada bazar rilisan fisik bulan ini. Versi digital bisa diunduh dengan harga sukarela.`,
  },
  {
    title: "Wawancara: di balik tata cahaya Gema Raya Fest",
    category: "liputan-event",
    status: "draft",
    published_at: null,
    views: 0,
    excerpt: "Draf wawancara dengan tim tata cahaya. Belum terbit.",
    body: `Draf ini belum terbit. Artikel berstatus draf hanya terlihat di admin.

## Pertanyaan yang sudah dijawab

- Berapa lama waktu pasang untuk tiga panggung?
- Apa yang berubah dari tahun lalu?`,
  },
  {
    title: "Jadwal lengkap Pasar Malam Suara per panggung",
    category: "press-release",
    published_at: new Date(Date.now() + 2 * DAY),
    views: 0,
    excerpt: "Contoh artikel terjadwal. Artikel ini tayang otomatis dua hari setelah data contoh dipasang.",
    body: `Artikel ini adalah contoh artikel terjadwal. Statusnya terbit, tetapi waktu terbitnya di masa depan, sehingga baru tampil di situs ketika waktunya tiba.`,
  },
];

export const events = [
  {
    title: "Senja Listrik: Tur Sepuluh Kota, Bandung",
    type: "konser",
    starts_at: at(1, "19:30"),
    ends_at: at(1, "22:30"),
    venue_name: "Gudang Sembilan",
    city: "Bandung",
    address: "Jl. Gudang Utara No. 9, Bandung",
    price_info: "Rp175.000",
    ticket_url: "https://example.com/tiket/senja-listrik-bandung",
    organizer_name: "Suara Malam Kolektif",
    summary: "Kota pertama dari tur terpanjang Senja Listrik, dengan separuh daftar lagu dari album yang belum dirilis.",
    description: `Senja Listrik membuka tur sepuluh kota di rumah sendiri. Band pembuka dipilih dari kiriman demo.

- Pintu dibuka 18.30
- Pertunjukan mulai 19.30
- Penonton di bawah 15 tahun wajib didampingi`,
  },
  {
    title: "Gema Raya Fest 2026",
    type: "festival",
    starts_at: at(3, "14:00"),
    ends_at: at(5, "23:00"),
    all_day: true,
    venue_name: "Lapangan Sasana Raya",
    city: "Jakarta",
    address: "Jl. Sasana Raya, Jakarta Pusat",
    price_info: "Harian mulai Rp350.000, terusan Rp850.000",
    ticket_url: "https://example.com/tiket/gema-raya-fest",
    organizer_name: "Gema Raya Kreasi",
    summary: "Tiga hari, tiga panggung, lebih dari enam puluh penampil lintas genre di satu lapangan.",
    description: `Festival musik lintas genre selama tiga hari. Tahun ini ada dua gerbang tambahan di sisi timur dan penukaran gelang sejak sehari sebelumnya.

## Yang baru tahun ini

- Jadwal panggung bergantian supaya suara tidak saling bocor
- Area duduk beratap di belakang menara suara
- Titik isi ulang air minum gratis`,
  },
  {
    title: "Diskusi: Mengurus Izin Keramaian Tanpa Pusing",
    type: "mice",
    starts_at: at(4, "13:00"),
    ends_at: at(4, "16:00"),
    venue_name: "Balai Rona",
    city: "Jakarta",
    address: "Jl. Rona Jaya No. 21, Jakarta Selatan",
    price_info: "Gratis dengan pendaftaran",
    ticket_url: "https://example.com/daftar/diskusi-izin",
    organizer_name: "Balai Rona",
    summary: "Tiga penyelenggara berbagi urutan langkah, dokumen, dan tenggat yang sering terlewat.",
    description: `Sesi tiga jam untuk penyelenggara acara pemula. Tiga pembicara membahas urutan pengurusan izin, dokumen yang diminta, dan waktu yang realistis.

Peserta mendapat daftar periksa yang bisa dipakai ulang.`,
  },
  {
    title: "Malam Akustik Teras Atap",
    type: "konser",
    starts_at: at(6, "19:00"),
    ends_at: at(6, "21:30"),
    venue_name: "Teras Atap Kala",
    city: "Yogyakarta",
    address: "Jl. Kala Senja No. 4, Yogyakarta",
    price_info: "Rp75.000 termasuk satu minuman",
    ticket_url: "https://example.com/tiket/malam-akustik",
    organizer_name: "Teras Atap Kala",
    summary: "Tiga penampil, delapan puluh kursi, tanpa pengeras suara besar.",
    description: `Malam akustik bulanan di atap. Kursi terbatas delapan puluh dan biasanya habis sebelum hari acara.`,
  },
  {
    title: "Bazar Rilisan Fisik: Kaset, Piringan, Zine",
    type: "bazar",
    starts_at: at(8, "10:00"),
    ends_at: at(8, "21:00"),
    all_day: true,
    venue_name: "Balai Rona",
    city: "Jakarta",
    address: "Jl. Rona Jaya No. 21, Jakarta Selatan",
    price_info: "Gratis",
    organizer_name: "Bising Tetangga",
    summary: "Empat puluh lapak label kecil, toko kaset, dan penerbit zine dalam satu hari.",
    description: `Bazar sehari untuk rilisan fisik. Bawa tas sendiri dan uang tunai, karena tidak semua lapak menerima pembayaran digital.`,
  },
  {
    title: "Temu Vendor Panggung Nusantara",
    type: "mice",
    starts_at: at(9, "09:00"),
    ends_at: at(10, "17:00"),
    all_day: true,
    venue_name: "Gedung Serbaguna Arkana",
    city: "Surabaya",
    address: "Jl. Arkana Timur No. 88, Surabaya",
    price_info: "Rp250.000 untuk dua hari",
    ticket_url: "https://example.com/daftar/temu-vendor",
    organizer_name: "Gema Raya Kreasi",
    summary: "Pameran dan temu bisnis penyedia tata suara, tata cahaya, panggung, dan rigging.",
    description: `Dua hari pameran peralatan dan sesi temu bisnis antara penyelenggara acara dan vendor panggung.`,
  },
  {
    title: "Pameran Poster Gigs 2010–2025",
    type: "pameran",
    starts_at: at(-2, "10:00"),
    ends_at: at(12, "20:00"),
    all_day: true,
    venue_name: "Balai Rona",
    city: "Jakarta",
    address: "Jl. Rona Jaya No. 21, Jakarta Selatan",
    price_info: "Gratis",
    organizer_name: "Klub Nonton Tepi Kota",
    summary: "Dua ratus poster pertunjukan dari lima belas tahun skena independen.",
    description: `Pameran poster pertunjukan musik yang dikumpulkan dari band, percetakan, dan kolektor. Buka setiap hari pukul 10.00 sampai 20.00.`,
  },
  {
    title: "Lomba Band Pelajar Piala Project Konser",
    type: "kompetisi",
    starts_at: at(13, "09:00"),
    ends_at: at(13, "17:00"),
    venue_name: "Gudang Sembilan",
    city: "Bandung",
    address: "Jl. Gudang Utara No. 9, Bandung",
    price_info: "Pendaftaran Rp150.000 per band, penonton gratis",
    ticket_url: "https://example.com/daftar/lomba-band-pelajar",
    organizer_name: "Suara Malam Kolektif",
    summary: "Dua puluh band SMA tampil masing-masing dua lagu, satu di antaranya ciptaan sendiri.",
    description: `Lomba band tingkat SMA. Setiap band membawakan dua lagu dan salah satunya harus ciptaan sendiri.`,
  },
  {
    title: "Pasar Malam Suara",
    type: "festival",
    starts_at: at(16, "15:00"),
    ends_at: at(17, "23:00"),
    all_day: true,
    venue_name: "Taman Kota Lama",
    city: "Semarang",
    address: "Kawasan Kota Lama, Semarang",
    price_info: "Harian Rp200.000, terusan Rp350.000",
    ticket_url: "https://example.com/tiket/pasar-malam-suara",
    organizer_name: "Suara Malam Kolektif",
    summary: "Dua panggung musik di tengah lapak makanan, komidi putar, dan bianglala.",
    description: `Festival dua hari dengan suasana pasar malam. Dua puluh empat penampil gelombang pertama sudah diumumkan.`,
  },
  {
    title: "Pentas Akhir Tahun Sanggar Laras",
    type: "pentas-seni",
    starts_at: at(20, "15:00"),
    ends_at: at(20, "18:00"),
    venue_name: "Teras Atap Kala",
    city: "Yogyakarta",
    address: "Jl. Kala Senja No. 4, Yogyakarta",
    price_info: "Donasi sukarela",
    organizer_name: "Sanggar Laras",
    summary: "Tari, karawitan, dan teater pendek dari murid sanggar usia enam sampai tujuh belas tahun.",
    description: `Pentas tahunan murid sanggar. Terbuka untuk umum dengan donasi sukarela.`,
  },
  {
    title: "Kapal Kertas Tenggelam: Konser Terakhir",
    type: "konser",
    starts_at: at(24, "20:00"),
    ends_at: at(24, "23:00"),
    venue_name: "Pendopo Agung Kala",
    city: "Yogyakarta",
    address: "Jl. Kala Senja No. 40, Yogyakarta",
    price_info: "Rp225.000",
    ticket_url: "https://example.com/tiket/konser-terakhir",
    organizer_name: "Gema Raya Kreasi",
    summary: "Tiga jam, lima album dimainkan berurutan, lalu selesai.",
    description: `Konser penutup perjalanan empat belas tahun Kapal Kertas Tenggelam. Lagu dari kelima album dimainkan berurutan sesuai tahun rilis.`,
  },
  {
    title: "Festival Film Pendek Tepi Kota",
    type: "festival",
    starts_at: at(30, "10:00"),
    ends_at: at(33, "22:00"),
    all_day: true,
    venue_name: "Ruang Putar Tepi Kota",
    city: "Malang",
    address: "Jl. Tepi Kota No. 15, Malang",
    price_info: "Rp25.000 per sesi",
    ticket_url: "https://example.com/tiket/film-pendek-tepi-kota",
    organizer_name: "Klub Nonton Tepi Kota",
    summary: "Empat hari pemutaran film pendek fiksi, dokumenter, dan film ponsel.",
    description: `Penyelenggaraan keenam festival film pendek ini menambah kategori film ponsel. Setiap sesi diikuti obrolan dengan pembuat film.`,
  },
  {
    title: "Orkes Pagi Buta: Pesta Rilis Album",
    type: "konser",
    starts_at: at(-6, "19:00"),
    ends_at: at(-6, "22:00"),
    venue_name: "Balai Rona",
    city: "Jakarta",
    address: "Jl. Rona Jaya No. 21, Jakarta Selatan",
    price_info: "Rp120.000",
    organizer_name: "Balai Rona",
    summary: "Album kedua dimainkan utuh dari lagu pertama sampai terakhir.",
    description: `Pesta rilis album *Sebelum Ayam Berkokok*. Acara ini sudah berlangsung.`,
  },
];

export const directory = [
  {
    kind: "venue",
    name: "Gudang Sembilan",
    city: "Bandung",
    address: "Jl. Gudang Utara No. 9, Bandung",
    contact: "sewa@gudangsembilan.example",
    website: "https://example.com/gudang-sembilan",
    instagram: "gudangsembilan",
    summary: "Bekas gudang tekstil berkapasitas 900 penonton berdiri, dengan plafon tinggi dan lantai beton.",
    description: `Gudang Sembilan adalah bekas gudang tekstil yang diubah menjadi ruang pertunjukan.

- Kapasitas 900 berdiri atau 400 duduk
- Panggung 10 × 6 meter
- Daya listrik 66 kVA
- Parkir 120 motor dan 30 mobil`,
  },
  {
    kind: "venue",
    name: "Balai Rona",
    city: "Jakarta",
    address: "Jl. Rona Jaya No. 21, Jakarta Selatan",
    contact: "halo@balairona.example",
    website: "https://example.com/balai-rona",
    instagram: "balairona",
    summary: "Gedung serbaguna dua lantai untuk pameran, diskusi, dan konser kecil sampai 350 orang.",
    description: `Balai Rona menyediakan satu aula utama dan dua ruang kecil. Dua belas akhir pekan setiap tahun disisihkan dengan tarif khusus untuk komunitas.`,
  },
  {
    kind: "venue",
    name: "Teras Atap Kala",
    city: "Yogyakarta",
    address: "Jl. Kala Senja No. 4, Yogyakarta",
    contact: "0812-0000-0101",
    instagram: "terasatapkala",
    summary: "Ruang atap terbuka dengan delapan puluh kursi, cocok untuk pertunjukan akustik dan pemutaran film.",
    description: `Teras atap di lantai empat dengan pemandangan kota. Tersedia tenda transparan untuk musim hujan.`,
  },
  {
    kind: "venue",
    name: "Gedung Serbaguna Arkana",
    city: "Surabaya",
    address: "Jl. Arkana Timur No. 88, Surabaya",
    contact: "pemasaran@arkana.example",
    website: "https://example.com/arkana",
    summary: "Aula tanpa tiang seluas 2.400 meter persegi untuk pameran dan konser sampai 3.500 penonton.",
    description: `Aula tanpa tiang dengan akses bongkar muat langsung ke lantai acara.`,
  },
  {
    kind: "artis",
    name: "Senja Listrik",
    city: "Bandung",
    contact: "manajemen@senjalistrik.example",
    instagram: "senjalistrik",
    summary: "Kuartet rock alternatif yang berdiri tujuh tahun lalu dan sedang menjalani tur sepuluh kota.",
    description: `Empat personel, dua album penuh, dan satu album ketiga yang sedang disiapkan.`,
  },
  {
    kind: "artis",
    name: "Orkes Pagi Buta",
    city: "Jakarta",
    contact: "orkespagibuta@example.com",
    instagram: "orkespagibuta",
    summary: "Orkes sembilan pemain dengan terompet, gesek, dan akordeon.",
    description: `Album kedua mereka, *Sebelum Ayam Berkokok*, direkam langsung di sebuah gudang kopi.`,
  },
  {
    kind: "artis",
    name: "Rana Wibisana",
    city: "Yogyakarta",
    contact: "kontak@ranawibisana.example",
    instagram: "ranawibisana",
    summary: "Penyanyi dan penulis lagu dengan gitar akustik dan cerita perjalanan.",
    description: `Kembali merilis single setelah tiga tahun tidak mengeluarkan lagu baru.`,
  },
  {
    kind: "organizer",
    name: "Gema Raya Kreasi",
    city: "Jakarta",
    contact: "kerjasama@gemaraya.example",
    website: "https://example.com/gema-raya",
    instagram: "gemarayafest",
    summary: "Penyelenggara Gema Raya Fest dan sejumlah konser tunggal berkapasitas besar.",
    description: `Berpengalaman mengelola festival tiga panggung dengan lebih dari enam puluh penampil.`,
  },
  {
    kind: "organizer",
    name: "Suara Malam Kolektif",
    city: "Semarang",
    contact: "halo@suaramalam.example",
    instagram: "suaramalam",
    summary: "Kolektif penyelenggara Pasar Malam Suara dan tur band independen di Jawa.",
    description: `Mengurus tur, pemesanan tempat, dan produksi untuk band independen.`,
  },
  {
    kind: "komunitas",
    name: "Bising Tetangga",
    city: "Bandung",
    instagram: "bisingtetangga",
    summary: "Kolektif band kamar yang saling meminjamkan alat dan merilis kompilasi bersama.",
    description: `Berawal dari grup percakapan antarkos. Terbuka untuk band yang merekam sendiri di rumah.`,
  },
  {
    kind: "komunitas",
    name: "Klub Nonton Tepi Kota",
    city: "Malang",
    contact: "klubnonton@example.com",
    instagram: "klubnontontepikota",
    summary: "Komunitas pemutaran film keliling dan penyelenggara festival film pendek tahunan.",
    description: `Memutar film di ruang komunitas, sekolah, dan balai warga, selalu diikuti obrolan.`,
  },
  {
    kind: "vendor",
    name: "Dentum Sound System",
    city: "Jakarta",
    contact: "0812-0000-0202",
    website: "https://example.com/dentum",
    instagram: "dentumsound",
    summary: "Sewa tata suara untuk acara berisi 200 sampai 20.000 penonton, lengkap dengan kru.",
    description: `Melayani konser, festival, dan acara perusahaan. Survei lokasi gratis untuk area Jabodetabek.`,
  },
  {
    kind: "vendor",
    name: "Sorot Tata Cahaya",
    city: "Bandung",
    contact: "sorot@example.com",
    instagram: "sorottatacahaya",
    summary: "Perancang dan penyedia tata cahaya panggung, dari kafe sampai lapangan.",
    description: `Tim perancang cahaya dengan operator berpengalaman di festival tiga panggung.`,
  },
  {
    kind: "vendor",
    name: "Rigging Tiga Titik",
    city: "Surabaya",
    contact: "0812-0000-0303",
    summary: "Jasa rigging, truss, dan atap panggung dengan teknisi bersertifikat.",
    description: `Menyediakan struktur panggung dan atap untuk acara luar ruang.`,
  },
];

export const ads = [
  {
    name: "Contoh header: Gema Raya Fest",
    slot: "header",
    template: "text",
    tone: "sun",
    headline: "Gema Raya Fest 2026",
    subline: "Tiga hari, tiga panggung. Tiket harian mulai Rp350.000.",
    cta_label: "Lihat jadwal",
    image_url: "",
    target_url: "/event/gema-raya-fest-2026",
  },
  {
    name: "Contoh sela konten: Dentum Sound",
    slot: "inline",
    template: "text",
    tone: "ink",
    headline: "Butuh tata suara untuk acara Anda?",
    subline: "Dentum Sound System melayani 200 sampai 20.000 penonton, lengkap dengan kru.",
    cta_label: "Lihat profil",
    image_url: "",
    target_url: "/direktori/dentum-sound-system",
  },
];

export const settings = {
  site_name: "Project Konser",
  tagline: "Kabar Berita, Konser dan Musik",
  description:
    "Portal kabar konser, musik, film, dan agenda event. Cari tahu apa yang ramai minggu ini dan ke mana harus pergi.",
  contact_email: "redaksi@projectkonser.id",
  instagram: "https://www.instagram.com/projectkonser",
  youtube: "https://www.youtube.com/@projectkonser",
  tiktok: "https://www.tiktok.com/@projectkonser",
  threads: "https://www.threads.com/@projectkonser",
  facebook: "",
  about: `Project Konser adalah portal kabar konser, musik, film, dan agenda event. Kami menulis tentang rilisan baru, meliput pertunjukan, dan mengumpulkan jadwal acara supaya Anda tahu ke mana harus pergi akhir pekan ini.

## Kirim kabar

Punya rilisan baru, siaran pers, atau acara yang perlu masuk agenda? Kirim lewat email redaksi. Sertakan tanggal, tempat, harga tiket, dan satu foto.

## Pasang iklan

Tersedia slot iklan di header yang tampil di semua halaman dan slot di sela konten. Hubungi redaksi untuk tarif dan jadwal tayang.

## Direktori

Venue, artis, organizer, komunitas, dan vendor bisa tampil di direktori tanpa biaya. Kirim profil singkat dan kontak yang bisa dihubungi.`,
};

// Tagar tiap artikel contoh, dicocokkan lewat judul.
export const postTags = {
  "Senja Listrik buka tur sepuluh kota dari Bandung": ["SenjaListrik", "tur", "Bandung"],
  "Orkes Pagi Buta rilis album kedua yang direkam di gudang kopi": ["OrkesPagiButa", "rilisan", "Jakarta"],
  "Film Lampu Kota Padam tayang bulan depan, cerita satu malam tanpa listrik": ["film", "bioskop"],
  "Tiga panggung, satu lapangan: catatan dari Gema Raya Fest tahun lalu": ["GemaRayaFest", "festival", "Jakarta"],
  "Pasar Malam Suara umumkan 24 penampil gelombang pertama": ["PasarMalamSuara", "festival", "Semarang"],
  "Kapal Kertas Tenggelam pamit lewat konser terakhir di Yogyakarta": ["konser", "Yogyakarta"],
  "Dokumenter Tukang Sound ikuti kru panggung keliling Jawa": ["film", "dokumenter"],
  "Lima hal yang perlu disiapkan sebelum festival musim hujan": ["festival", "tips"],
  "Malam akustik di Teras Atap Kala penuh sejak pintu dibuka": ["konser", "Yogyakarta"],
  "Rana Wibisana kembali dengan single setelah tiga tahun diam": ["rilisan", "RanaWibisana"],
  "Balai Rona buka jadwal sewa gedung untuk komunitas tahun depan": ["venue", "Jakarta"],
  "Festival Film Pendek Tepi Kota terima karya sampai akhir bulan": ["film", "festival", "Malang"],
  "Naik kereta ke konser: rute malam yang sering terlewat": ["konser", "tips"],
  "Kolektif Bising Tetangga rilis kompilasi 12 band kamar": ["rilisan", "Bandung"],
};

// Slide di bagian atas beranda. Slide foto tanpa gambar memakai sampul bawaan;
// ganti dengan foto dari ImageKit lewat Admin > Slide.
export const slides = [
  {
    kind: "photo",
    title: "Gema Raya Fest 2026: tiga hari, tiga panggung",
    caption: "Tiket harian mulai Rp350.000. Gerbang dibuka pukul 14.00.",
    link_url: "/event/gema-raya-fest-2026",
    sort: 1,
  },
  {
    kind: "video",
    title: "Contoh slide video",
    caption: "Video ini hanya contoh. Ganti tautan YouTube-nya dari Admin, menu Slide.",
    // Big Buck Bunny, film pendek berlisensi terbuka dari Blender Foundation.
    video_url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    sort: 2,
  },
  {
    kind: "photo",
    title: "Senja Listrik buka tur sepuluh kota",
    caption: "Kota pertama: Bandung. Separuh daftar lagu diambil dari album yang belum dirilis.",
    link_url: "/berita/senja-listrik-buka-tur-sepuluh-kota-dari-bandung",
    sort: 3,
  },
];
