# DESIGN.md — AniSphere

> Baca di awal setiap chat desain, bersama PROGRESS.md dan API.md. Perombakan ini HANYA mengubah tampilan:
> jangan mengubah logika, parameter URL (?q, ?page, ?filter), alur login, atau kontrak API. Konten pengguna tetap dirender sebagai teks biasa (PRD aturan 11).
> Dibuat 2026-11-21 (D0). Nilai warna adalah titik awal terinspirasi palet GitHub; D1 wajib memverifikasi kontras.

## 1. Arah

Bersih dan lega, terinspirasi GitHub. Sampul anime adalah pusat perhatian, jadi antarmuka netral dan aksen global tenang. Ponsel dulu: tulis gaya untuk layar kecil, lalu tambahkan variasi lebar dengan `lg:`.

## 2. Keputusan

| Hal                | Keputusan                                                                                                                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tema               | Terang, gelap, ikut sistem (default sistem)                                                                                                                                                                                                                                     |
| Aksen global       | Biru ala GitHub, sama untuk semua pengguna                                                                                                                                                                                                                                      |
| Aksen profil       | Pilihan terbatas (6 opsi, lihat bagian 5), hanya di halaman profil                                                                                                                                                                                                              |
| Huruf              | Tumpukan font sistem: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif`                                                                                                                                                                |
| Ikon               | Satu pustaka (lucide-react), semua impor lewat satu berkas `components/common/icons.jsx` agar mudah diganti SVG kustom                                                                                                                                                          |
| Navigasi ponsel    | Header atas: menu (hamburger) di kiri membuka laci dari kiri; logo; ikon cari dan avatar atau tombol Masuk di kanan. Tanpa bilah bawah                                                                                                                                          |
| Navigasi laptop    | Header lengket (latar subtle, garis bawah border): hamburger di kiri membuka laci yang sama dengan ponsel (Beranda, MyList saat login), logo, lalu di kanan kolom cari, pengalih tema, dan avatar (menu: Profil saya, Edit profil, MyList, Keluar) atau tombol Masuk dan Daftar |
| Sudut dan bayangan | `rounded-md` (6px), bayangan minimal, garis tipis sebagai pemisah                                                                                                                                                                                                               |
| Bahasa antarmuka   | Inggris penuh (label, tombol, placeholder, aria-label, pesan, alt, judul tab). Setiap chat desain menerjemahkan semua teks di berkas yang disentuhnya. `<html lang="en">`. Dokumen kerja tetap Indonesia                                                                        |
| Judul anime        | Selalu romaji (fallback english, lalu native). Satu helper getAnimeTitle di utils/animeLabels.js untuk data AniList; judul watchlist (anim_title) tersimpan romaji di server                                                                                                    |

## 3. Tema

- Atribut `data-theme="light|dark"` pada `<html>`. Mode pilihan disimpan di `localStorage` kunci `anisphere-theme` (`system|light|dark`; nilai lain diabaikan, bungkus try/catch).
- Skrip kecil di `index.html` memasang tema sebelum React dimuat (tanpa berkedip). Mode `system` mengikuti `prefers-color-scheme` dan memperbarui diri saat berubah.
- Tailwind 4: warna didefinisikan sebagai variabel CSS lalu dipetakan lewat `@theme`; varian gelap lewat `@custom-variant dark` berbasis `data-theme`. Komponen memakai kelas token (`bg-canvas`, `text-fg`), bukan warna mentah.
- Varian dark: berbasis data-theme (varian theme-dark sementara dihapus karena identik). Kelas yang memakai token tidak butuh dark:. DEFAULT_MODE ada di utils/theme.js.

## 4. Token

| Token           | Terang  | Gelap   | Pakai untuk                                 |
| --------------- | ------- | ------- | ------------------------------------------- |
| canvas          | #ffffff | #0d1117 | latar halaman                               |
| subtle          | #f6f8fa | #151b23 | kartu, header, panel                        |
| border          | #d0d7de | #3d444d | pemisah, tepi kartu                         |
| border-strong   | #818b98 | #656c76 | tepi input dan kontrol, kontras minimal 3:1 |
| fg              | #1f2328 | #f0f6fc | teks utama                                  |
| muted           | #59636e | #9198a1 | teks sekunder                               |
| accent          | #0969da | #4493f8 | tautan, ikon aktif, tab aktif               |
| accent-emphasis | #0969da | #1f6feb | isi tombol utama                            |
| on-accent       | #ffffff | #ffffff | teks di atas accent-emphasis                |
| success         | #1a7f37 | #3fb950 | completed                                   |
| attention       | #9a6700 | #d29922 | plan to watch                               |
| danger          | #d1242f | #f85149 | dropped, error, hapus                       |
| done            | #8250df | #ab7df8 | lencana khusus                              |

Kontras terukur (teks pada canvas): fg 15,8 / 17,4; muted 6,1 / 6,5; accent 5,2 / 6,1; success 5,1 / 7,5; attention 4,9 / 7,5; danger 5,2 / 5,7. Semua di atas 4,5:1 pada canvas dan subtle. Tepi tombol utama gelap (#1f6feb di atas canvas) hanya 4,1:1, cukup untuk komponen (minimal 3:1).

Tombol danger memakai teks dan garis danger di atas canvas, tanpa isian (teks putih di atas danger gelap #f85149 hanya 3,35:1).

Status watchlist: watching = accent, completed = success, dropped = danger, plan to watch = attention. Selalu disertai label teks atau ikon, jangan warna saja.

## 5. Aksen profil

- Server hanya menyimpan KUNCI dari daftar tetap (kolom baru di user_profiles, migrasi 006). Nilai warna tidak pernah datang dari pengguna.
- Di halaman profil, wadah diberi `data-accent="<kunci>"`; CSS menetapkan `--profile-accent` dan `--profile-on-accent` per kunci dan tema. Tanpa pilihan (`default`) memakai aksen global.
- Dipakai untuk elemen dekoratif (garis header, batang statistik, tombol di halaman itu). Bukan untuk teks panjang.

| Kunci  | Terang (isi) | Gelap (isi) | Teks di atas    | Kontras isi vs canvas (terang / gelap) |
| ------ | ------------ | ----------- | --------------- | -------------------------------------- |
| violet | #8250df      | #ab7df8     | putih / #0d1117 | 5,1 / 6,3                              |
| teal   | #0f766e      | #39c5cf     | putih / #0d1117 | 5,5 / 9,1                              |
| orange | #bc4c00      | #f0883e     | putih / #0d1117 | 5,0 / 7,5                              |
| pink   | #bf3989      | #f778ba     | putih / #0d1117 | 5,1 / 7,5                              |
| green  | #1a7f37      | #3fb950     | putih / #0d1117 | 5,1 / 7,5                              |

Teks putih di atas isi terang bernilai minimal 5,0:1; teks gelap di atas isi gelap minimal 6,3:1.

## 6. Responsif

| Lebar                               | Layout                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| di bawah 1024px (ponsel dan tablet) | tata letak ponsel; tablet memakai wadah lebih lebar dan kolom grid lebih banyak |
| 1024px ke atas (laptop dan desktop) | tata letak laptop; desktop besar dibatasi `max-w-7xl` (1280px) dan dipusatkan   |

- Grid katalog: 2 kolom (default), 3 (`sm`), 4 (`md`), 6 (`lg`). Semua membagi 48 (jumlah per halaman).
- Target sentuh minimal 44px. Tidak ada fungsi yang hanya muncul saat hover. Tab filter bisa digulir horizontal. Tabel MyList menjadi daftar kartu di ponsel.
- Uji pada 375px, 768px, 1366px, 1920px: tidak ada gulir horizontal pada halaman.

## 7. Aturan komponen

- Komponen dasar di `components/common`: Button, Card, Input, Modal, Badge, Avatar, Skeleton, plus `icons.jsx`.
- Cincin fokus terlihat (accent) pada semua kontrol. Hormati `prefers-reduced-motion`.
- Pindahkan komponen lama ke `features/` hanya saat file itu memang disentuh oleh chat desain.

## 8. Uji manual (ulang di akhir tiap chat desain)

1. Login, refresh (tetap login), logout.
2. Home: filter dan pagination di URL, cari, Back mempertahankan keadaan.
3. Detail anime, tambah ke list (termasuk saat belum login).
4. MyList: ubah, +1 episode, hapus.
5. /u/<username>, follow dan unfollow, edit profil.
6. Tema terang, gelap, sistem; refresh tanpa berkedip.
7. Lebar 375px dan 1366px tanpa gulir horizontal; keyboard Tab menunjukkan fokus.

## 9. Status chat desain

| Chat | Isi                                                      | Status                   |
| ---- | -------------------------------------------------------- | ------------------------ |
| D0   | DESIGN.md                                                | selesai                  |
| D1   | Fondasi: tema, token, komponen dasar, ikon               | selesai                  |
| D2   | Kerangka: header, navigasi ponsel, footer, wadah halaman | selesai                  |
| D3   | Home dan katalog                                         | selesai (D3A sampai D3D) |
| D4   | Detail anime                                             | belum                    |
| D5   | MyList                                                   | belum                    |
| D6   | Profil, edit profil, aksen (plus backend 006)            | belum                    |
| D7   | Login dan Register                                       | belum                    |
| D8   | Poles: kondisi kosong, error, loading, aksesibilitas     | belum                    |

## 10. Halaman Home (D3)

Urutan: baris unggulan (carousel + panel forum), hero, kotak hasil, isi.

- Baris unggulan: grid 3 kolom di lg (carousel lg:col-span-2, panel forum 1 kolom); di bawah lg satu kolom (carousel dulu, panel forum ringkas di bawahnya).
- Carousel: slide dari GET /catalog/anime/featured (maks 8). Gambar banner (fallback sampul besar), lencana skor dan format di kiri atas, judul, tombol (Details, + Watchlist, + Plan to Watch), titik indikator. Scroll-snap dan geser di ponsel, panah di laptop. role="region" aria-roledescription="carousel", slide diberi "n dari total". Autoplay maks 6 detik per slide, berhenti saat hover, fokus, atau sentuh, ada tombol jeda, mati bila prefers-reduced-motion. Gambar slide pertama dimuat prioritas, sisanya lazy; rasio tetap agar tidak bergeser. Teks di atas gambar memakai putih dengan scrim gelap (pengecualian token).
- Panel forum: wadah "Discussion forum - Coming soon" tanpa isi palsu; komponen menerima daftar postingan agar Phase 3 tinggal mengisi.
- Hero: wadah bg-subtle, border, tanpa kolom cari; teks, tab kategori di dalam wadah, dan chip "Results for ..." (dengan tombol hapus) saat ada ?q=.
- Kotak hasil: bilah bg-subtle berisi ikon, label kecil, judul bagian, kontrol halaman (ikon panah, "Page N", label aksesibel), dan tombol tampilan grid/daftar. Kontrol halaman juga di bawah isi.
- Grid kartu: 2 (default), 3 (sm), 4 (md), 6 (lg) kolom. Daftar: 1 (default), 2 (md), 3 (lg) kolom. Parameter URL: ?view=list (grid default) di samping ?q, ?page, ?filter.
- Kartu daftar: poster di kiri; kanan: judul, lalu rows Format and Episodes, Status and season/year, Score, dan lencana genre.
