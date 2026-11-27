# PROGRESS.md — AniSphere

> Baca file ini di awal setiap chat. Perbarui setiap selesai satu tugas.
> Snapshot awal dibuat 2026-11-01 dari `project-akhir-blk-main.zip` (kode per 2026-09-21).
> Target lengkap ada di PRD (`product_requirement_document_prd.md`). File ini hanya mencatat KONDISI SAAT INI.

## 1. Posisi Saat Ini

- **Phase aktif:** Phase 2 selesai. Fase desain: D0, D1, D2, D3, D4 selesai. L1 selesai (kerangka).
- **Sedang dikerjakan:** -
- **Berikutnya:** D5 (MyList), lalu D6 sampai D8 (tiap chat desain menerjemahkan berkas yang disentuhnya).

## 2. Stack Aktual (sesuai repo)

- **Frontend:** React 19, Vite 8, Tailwind CSS 4 (`@tailwindcss/vite`), React Router 7, Axios, lucide-react (ikon, hanya lewat components/common/icons.jsx), React Compiler. Package manager: pnpm.
- **Backend:** Node.js (ESM, file `.mjs`), Express 5, MySQL (`mysql2`), JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`, `axios`, `cookie-parser`, `express-rate-limit`. Dev: `nodemon`, Vitest, Supertest.
- **API anime eksternal:** AniList (GraphQL) saja. Jikan dibuang.

## 3. Keputusan Final

- AniList adalah satu-satunya API anime publik. Jangan menambah atau memakai Jikan.
- Arsitektur target: modular monolith (`backend/src/modules/<fitur>/`) dan frontend per fitur (`frontend/src/features/<fitur>/`).
- Validasi input dengan Zod. HTML dari API eksternal wajib disanitasi.
- Strategi: refactor bertahap, jangan tulis ulang dari nol.
- Format anime AniList (TV_SHORT, MUSIC) ditampung di database lewat migrasi #6 sebagai 'TV Short' dan 'Music'. Frontend tidak memakai pemetaan format.
- Watchlist memakai anime_catalog + user_anime. Nilai status memakai spasi ('plan to watch', 'on hold', 'rewatching'), bukan underscore seperti draf PRD. API baru menerima 4 status (watching, completed, dropped, plan to watch).
- Perubahan skema database hanya lewat file migrasi bernomor di backend/src/db/migrations/ (pnpm migrate): tanpa DROP/TRUNCATE, tanpa DELIMITER, idempotent. project_akhir_blk.sql hanya untuk instalasi baru.
- Skor di API: angka 1-10 dengan maksimal 1 desimal (mis. 8.5). Kolom database DECIMAL(3,1).
- Katalog (anime_catalog) dibagi antar user dan diisi SERVER dari AniList berdasarkan externalId (opsi C, berlaku sejak C1). Total episode untuk aturan completed dan batas episode selalu dari katalog. Gambar katalog = coverImage.large. Field lama di body (title, imgUrl, totalEps, type di POST; teps di PUT) ditolak 400 sejak C3.
- Katalog: perPage 48 ditentukan server; daftar top (semua filter) maks 10 halaman; filter hanya berlaku tanpa q (klik tab menghapus q, mencari menghapus filter). q, page, dan filter disimpan di URL.
- Dua perangkat (Windows dan Linux): .env, .env.test, isi database, dan node_modules per perangkat, tidak ikut git. Setelah git pull: pnpm install bila package.json/lockfile berubah; pnpm migrate (backup dulu) bila ada file migrasi baru. Database test (AniWatchList_test) dibuat manual di tiap perangkat.
- Semua respons error API memakai status "error" (bukan "fail"). POST /auth/register mengembalikan us_id.
- Tes backend: black box lewat Supertest berdasarkan API.md; hanya jalan di database berakhiran `_test`; tidak boleh memanggil internet (AniList di-mock). Temuan yang belum diputuskan ditandai it.fails, bukan diperbaiki diam-diam.
- Auth cookie: access_token (JWT, HttpOnly) dan csrf_token (bisa dibaca JS, double-submit lewat header X-CSRF-Token). SameSite=Lax; frontend dan backend harus satu situs (localhost:5173 dan localhost:3000 sama-situs; di produksi satu domain induk, kalau tidak pakai none + Secure). CSRF dicek di dalam middleware protect (route baru otomatis terlindungi); register, login, logout bebas CSRF, Bearer dihapus; hanya cookie. CSRF wajib untuk semua mutasi terautentikasi.
- Path API dipertahankan (/anime, /catalog/anime, /auth/profile); PRD disesuaikan dengan kode.
- Modul backend diekspor lewat modules/<nama>/index.mjs. Kode di luar modul hanya boleh mengimpor index.mjs modul itu; integrations/ tidak boleh mengimpor modules/. Dijaga tests/architecture.test.mjs. Modul baru memakai pola controller-service-model.
- Phase 2: URL profil memakai username (us_name). Respons profil camelCase, tidak pernah memuat email, hash password, atau us_id. Profil privat menyembunyikan statistik dari orang lain; follow tanpa persetujuan. Avatar dan banner ditunda ke Phase 3. Follow memakai POST dan DELETE (idempotent), bukan toggle. Daftar followers/following dan pencarian pengguna ditunda; hanya jumlah yang tampil. Statistik dihitung saat diminta, tanpa cache. Kode frontend baru di frontend/src/features/profile/.
- Follow dan unfollow idempotent (INSERT ... ON DUPLICATE KEY UPDATE; DELETE), mengikuti diri sendiri 400, follow juga untuk profil privat. followersCount dan followingCount selalu tampil, juga untuk profil privat; isFollowing hanya true untuk pemanggil login non-pemilik yang mengikuti. Pembatas follow (60/15 menit per user) dipakai bersama oleh POST dan DELETE lewat satu instance.
- Desain: lihat DESIGN.md (tema terang/gelap/sistem ala GitHub, aksen global biru, aksen profil 5 pilihan + default, ponsel dulu dengan titik pisah 1024px). Perombakan hanya mengubah tampilan, bukan logika atau kontrak.
- UI dan pesan API berbahasa Inggris; dokumen kerja Indonesia; judul anime selalu romaji (pesan server diterjemahkan di server, bukan dipetakan di klien).

## 4. Struktur Saat Ini (sesuai target backend)

**Backend** (modular):
`src/{config, db (migrate.mjs, migrations/), integrations/anilist (anilist.client.mjs, anilist.format.mjs, index.mjs), middlewares, modules/{anime, watchlist, auth, users} (tiap modul: <nama>.{controller,service,model,routes,validator}.mjs + index.mjs), utils (validation.mjs, authCookies.mjs, ...), app.mjs}`

- Modul watchlist punya service hanya untuk statistik (`watchlist.service.mjs`); controller-nya masih memanggil model langsung.
- Aturan impor (dijaga `tests/architecture.test.mjs`): kode di luar `modules/<b>` hanya boleh mengimpor `modules/<b>/index.mjs`; `integrations/` tidak boleh mengimpor `modules/`.
- Fitur yang ada: `auth`, `watchlist` (modul di modules/watchlist), `anime` (katalog, sudah modul di modules/anime), users (modul di modules/users: controller, service, model, routes, validator; profil dan follow).
- `backend/public/` berisi frontend statis lama (HTML/JS/CSS), kemungkinan sudah tidak dipakai.
- `backend/api_test/` berisi koleksi uji endpoint (format YAML).
- Tes backend: `backend/vitest.config.mjs`, `backend/tests/` (base-schema.sql, base-legacy-animes.sql, global-setup.mjs, setup.mjs, support/, {auth,auth-cookie,watchlist,catalog,catalog-featured,rateLimit,db,architecture,users,follow}.test.mjs).
- Folder yang diizinkan di src/: config, db, integrations, middlewares, modules, utils, plus app.mjs (dijaga tests/architecture.test.mjs).
- Katalog (T1): modules/anime/{catalog.service.mjs (toCatalogRow, aturan judul romaji), catalog.refresh.service.mjs (refreshCatalog)}; integrations/anilist menambah getAnimeBatches (id_in per 50, jeda, retry 429); CLI db/refresh-catalog.mjs (pnpm catalog:refresh [--dry-run]). Tes: tests/catalog-refresh.test.mjs.

**Frontend:**
`src/{components/common, components/features/{anime,aunt,user}, context, features/profile, hooks, layouts, pages, services, utils}`

- Fondasi desain (D1): `utils/{theme.js, cx.js}`, `hooks/useTheme.js`, `components/common/{icons.jsx, Button, Card, Input, Modal, Badge, Avatar, Skeleton, ThemeToggle}.jsx`, `pages/DesignPreview.jsx` (rute /design hanya saat import.meta.env.DEV). Token warna ada di `assets/styles/index.css` (variabel `--ds-*`, dipetakan lewat @theme inline).
- Halaman lama belum memakai token. ThemeProvider lama (kelas .dark, kunci localStorage "theme") dan @custom-variant dark lama masih aktif sampai D2.
- Kerangka (D2): `components/common/{Header, NavDrawer, Footer, linkButtonClasses}, layouts/MainLayout.jsx` (min-h-dvh, tautan "Skip to content", wadah max-w-7xl). Tema hanya lewat `utils/theme.js` dan `hooks/useTheme.js` (kunci anisphere-theme, DEFAULT_MODE). ThemeProvider, ThemeContext, context/useTheme, ThemeSwitcher, dan Navbar sudah dihapus. @custom-variant dark berbasis data-theme.
- Home (D3B): `components/common/{AnimeGridSkeleton, Pagination, FilterTabs, DaftarAnime, CardImage}.jsx` sudah memakai token. `utils/animeLabels.js` berisi formatLabel dan statusLabel.
- Home (D3C): tampilan grid/daftar lewat ?view=list (grid default, nilai lain dianggap grid). `components/common/{AnimeListItem, ViewToggle}.jsx` baru; DaftarAnime dan AnimeGridSkeleton menerima prop view. `utils/catalogLayout.js` (kelas grid bersama), `utils/catalogFilters.js` memuat buildCatalogPath dan parseCatalogView (semua URL katalog dibangun lewat sini). `utils/animeLabels.js` memuat getAnimeTitle dan seasonLabel; label status berbahasa Inggris.
- Home (D3D): `features/anime/{useFeatured.js, FeaturedCarousel.jsx, FeaturedSlide.jsx, FeaturedRow.jsx}, features/watchlist/useAddToList.js, features/community/ForumPanel.jsx, hooks/usePrefersReducedMotion.js`. icons.jsx menambah MessagesSquare, Pause, Play. Baris unggulan tampil di atas hero hanya bila tanpa ?q= dan page = 1.
- Detail (D4): `features/anime/{useAnimeDetail.js, AnimeHero.jsx, AnimeScoreCard.jsx, ComingSoonButton.jsx, AnimeSynopsis.jsx, AnimeInfoSidebar.jsx, AnimeExternalLinks.jsx, AnimeRelations.jsx, AnimeCharacters.jsx, AnimeDetailSkeleton.jsx}`. pages/AnimeDetail.jsx hanya merangkai hook dan komponen (MainLayout username tetap dipakai).
- Halaman: `Home`, `MyList` (protected), `AnimeDetail`, `Profile` (publik, /u/:username), `ProfileEdit` (protected, /profile/edit), `NotFound`. Login dan Register berupa komponen form yang dipakai langsung sebagai route.
- Fitur profil: `features/profile/{profileApi.js, profileErrors.js, useProfile.js, ProfileHeader.jsx, ProfileStats.jsx, ScoreDistribution.jsx, ProfileStatus.jsx, ProfileEditForm.jsx, FollowButton.jsx}`. `pages/Profile.jsx` dan `pages/ProfileEdit.jsx` hanya merangkai hook dan komponen.
- Baru `features/profile` yang mengikuti struktur PRD; komponen lama di `components/features/{anime,aunt,user}` dipindahkan saat fase desain.
- Frontend katalog: `components/common/{Pagination,DaftarAnime,FilterTabs}.jsx`, `utils/catalogFilters.js` (daftar filter, harus sama dengan validator backend).

## 5. Endpoint yang Sudah Ada

| Method | Path                            | Auth     | Keterangan                                                                                                              |
| ------ | ------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/auth/register`            | tidak    | daftar                                                                                                                  |
| POST   | `/api/auth/login`               | tidak    | user di body, JWT hanya di cookie                                                                                       |
| GET    | `/api/auth/profile`             | ya       | profil dari JWT                                                                                                         |
| GET    | `/api/anime`                    | ya       | seluruh watchlist user                                                                                                  |
| GET    | `/api/anime/:anim_id`           | ya       | satu item watchlist                                                                                                     |
| POST   | `/api/anime`                    | ya       | tambah ke watchlist                                                                                                     |
| PUT    | `/api/anime/:anim_id`           | ya       | ubah item                                                                                                               |
| PATCH  | `/api/anime/:anim_id/increment` | ya       | tambah episode                                                                                                          |
| DELETE | `/api/anime/:anim_id`           | ya       | hapus item                                                                                                              |
| GET    | `/api/catalog/anime`            | tidak    | daftar top (10 filter) dan pencarian, berpaginasi (?q, ?page, ?filter); item memuat genres, season, seasonYear.         |
| GET    | `/api/catalog/anime/featured`   | tidak    | maks 8 anime RELEASING trending untuk carousel Home (cache 30 menit, tanpa parameter)                                   |
| GET    | `/api/catalog/anime/:id`        | tidak    | detail anime (AniList)                                                                                                  |
| GET    | `/api/users/:username`          | opsional | profil publik + statistik + followersCount, followingCount, isFollowing (stats null untuk profil privat bukan pemilik). |
| PUT    | `/api/users/profile`            | ya       | ubah displayName, bio, isPrivate                                                                                        |
| POST   | `/api/users/:username/follow`   | ya       | ikuti pengguna (idempotent), data: username, isFollowing, followersCount                                                |
| DELETE | `/api/users/:username/follow`   | ya       | berhenti mengikuti (idempotent)                                                                                         |

**Catatan**: Keputusan (2026-11-16): path di kode dipertahankan; PRD disesuaikan.

## 6. Database Saat Ini

- Database `AniWatchList`. Tabel: `users`, `anime_catalog`, `user_anime`, `schema_migrations`, `animes_legacy` (cadangan hasil rename migrasi 004, tidak dipakai kode), `user_profiles` dan `follows` (migrasi 005; follows dipakai sejak 2B)
- Stored procedure: hanya `sp_insert_user` (dipakai auth).
- Migrasi: 001 sampai 005.
- DROP MANUAL animes_legacy pada atau setelah 2026-12-16, setelah backup, di luar runner migrasi, lalu catat di sini.

## 7. Status Checklist Phase 0

Status hasil pemeriksaan kode, bukan asumsi.

| #   | Item                   | Status      | Temuan                                                                                                                                                   |
| --- | ---------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | AuthProvider ganda     | [x] SELESAI | Tersisa satu di `main.jsx`.                                                                                                                              |
| 2   | URL API hardcode       | [x] SELESAI | `api.js` memakai `VITE_API_URL`. `.env.example` terisi.                                                                                                  |
| 3   | JWT di cookie HttpOnly | [x] SELESAI | 13A, 13B, 13C selesai: cookie HttpOnly + CSRF, tanpa Bearer, tanpa token di body                                                                         |
| 4   | Validasi Zod           | [x] SELESAI | Auth dan watchlist (param, POST, PUT) divalidasi strict di `validators/`.                                                                                |
| 5   | Sanitasi HTML          | [x] SELESAI | DOMPurify, whitelist tag dasar, tanpa atribut.                                                                                                           |
| 6   | Migrasi DB aman        | [x] SELESAI | Kode watchlist memakai anime_catalog + user_anime. Tabel animes lama jadi cadangan.                                                                      |
| 7   | standarkan AniList     | [x] SELESAI | Timeout 10 detik, cache memori 5 menit, pesan error 429/502/504.                                                                                         |
| 8   | Test runner            | [x] SELESAI | Vitest + Supertest, database test AniWatchList_test, ~28 tes auth, ~93 tes watchlist, ~51 tes katalog (AniList di-mock). Tidak ada tes it.fails tersisa. |

## 8. Utang Teknis & Kebersihan

- `frontend/package.json` bernama `react-starter-kit`, ganti jadi `anisphere-frontend`.
- Nama file dan komentar campur Indonesia dan Inggris (`aunt`). Rapikan saat refactor modul.
- Daftar filter katalog ada di dua tempat (validator backend dan frontend/src/utils/catalogFilters.js). Jaga tetap sama.
- tests/base-schema.sql dan tests/base-legacy-animes.sql menyalin skema users dan animes. Hapus base-legacy-animes.sql saat animes_legacy di-drop; rapikan project_akhir_blk.sql dan migrasi 001/002 jika sudah tidak dibutuhkan.
- Perilaku belum tercatat di API.md: isi data pada respons DELETE; hasil PATCH saat episode sudah sama dengan total.
- Batas minimal JWT_SECRET (16) ada di dua tempat (env.mjs dan tests/support/env.mjs), jaga tetap sama.
- Katalog hanya disegarkan saat ada yang menambahkan anime itu (tidak ada penyegaran terjadwal, MyList tidak memicu penyegaran).
- Variabel CORS_ORIGINS, COOKIE_SECURE, COOKIE_SAMESITE wajib ada di .env dan .env.test di tiap perangkat (cek Linux).
- Logout hanya menghapus cookie, tidak ada revokasi token: JWT yang bocor berlaku sampai kedaluwarsa (7 hari).
- Koleksi Bruno (backend/api_test) harus memakai cookie + header X-CSRF-Token. Perbarui jika masih Bearer.
- Sebelum produksi: COOKIE_SECURE=true, HTTPS, CORS_ORIGINS produksi, frontend dan backend satu domain induk, NODE_ENV=production (stack error dimatikan).
- State pembatas laju di memori proses (per instance); pindah ke store Redis jika multi-instance. Produksi di belakang proxy wajib mengisi TRUST_PROXY sesuai jumlah proxy.
- controller watchlist masih memanggil model langsung, service baru hanya untuk statistik
- Nama internal watchlist (Anime, getAllAnime, cariAnimeById) masih campur Indonesia dan Inggris. Jangan mengganti nama field respons `anim_*`, itu kontrak.
- Komentar di watchlist.model.mjs masih menyebut Stored Procedure padahal sudah query biasa. Perbaiki sambil lalu.
- bio dan displayName disimpan apa adanya; frontend wajib merender sebagai teks (tidak boleh dangerouslySetInnerHTML).
- Regex username hanya untuk pendaftar baru; username lama bisa tidak cocok (cek query pemeriksaan di setiap perangkat) dan diakses ter-encode.
- Hitungan follow dihitung saat diminta dengan `COUNT(*)` (tanpa cache). Bergantung pada indeks: primary key (follower_id, following_id) dan indeks foreign key following_id dari migrasi 005. Jika kelak lambat, tambah kolom hitungan atau cache.
- GET profil kini menjalankan 2 query tambahan (hitungan dan isFollowing) secara paralel.
- Pencocokan username mengikuti collation MySQL (tidak peka huruf besar/kecil); respons follow memakai ejaan tersimpan.
- Daftar followers/following, pencarian pengguna, dan notifikasi follow belum ada (Phase 5 untuk notifikasi).
- Menyimpan formulir edit profil tanpa mengubah apa pun menyimpan username sebagai displayName (bukan null). Tidak berbahaya; rapikan di D6 (kirim null bila sama dengan username).
- Frontend belum punya test runner; UI diverifikasi manual. Pertimbangkan Vitest + Testing Library setelah fase desain.
- Gambar berat: public/favicon.png (304 KB) dan public/logo.png (250 KB). Optimalkan.
- Nama berkas logo di Header.jsx (LOGO_SRC) harus sama dengan berkas di frontend/public/.
- Halaman lama masih memakai warna mentah (`slate-*`, `bg-white`) dan belum memakai token; dirapikan di D3 sampai D7.
- utils/formatStatus.js dan utils/formatValue.js tidak lagi diimpor AnimeDetail (kini memakai animeLabels.js); berkas belum dihapus dan pemakai lain belum diperiksa.
- AnimeListItem memakai div dengan kelas yang sama seperti CardImage, bukan komponen Card. Samakan ke Card di D8 bila Card cocok.
- Teks antarmuka Inggris sudah mencakup Home, FilterTabs, Pagination, CardImage, animeLabels, komponen D3C, Header, NavDrawer, Footer, ThemeToggle, Modal, ErrorApiPage, NotFound, dan formatDate (L1), AnimeDetail (D4). Masih memuat teks Indonesia: layouts/MainLayout.jsx ("Skip to content"), features/profile/\*, pages/Profile.jsx, pages/ProfileEdit.jsx, LoginForm dan form Register (components/features/aunt), MyList, components/features/{anime,user}, ProtectedRoute.jsx. Dirapikan per chat desain.
- Pemanggil formatDate (ProfileHeader, MyList) perlu dicek saat berkasnya disentuh. formatDate hanya menerima { year, month, day }; periksa apakah joinedAt (string ISO) di ProfileHeader benar-benar lewat fungsi ini.
- getAnimeTitle dipakai di Home, carousel, dan Detail. Tinggal tempat lain yang menampilkan judul AniList (MyList memakai anim_title dari server).
- AnimeDetail.jsx masih memiliki handleAddToList sendiri (kata-kata Indonesia, mengirim tier/score/notes null). Dialihkan ke useAddToList di D4.
- L2A selesai: semua pesan server (AppError, Zod, controller, middleware auth/CSRF/validate, pembatas laju, klien AniList) berbahasa Inggris. Pesan batas laju memakai detik bila sisa waktu < 60 detik, selain itu menit ("1 minute" / "N minutes"). Tes Supertest dan koleksi Bruno yang memeriksa teks Indonesia belum diperbarui (L2B); kode status tidak berubah.
- Error tak terduga (500) meneruskan err.message mentah ke klien (error.middleware dan controller katalog). Pertimbangkan pesan generik di produksi.
- Skor lencana carousel = averageScore / 10 (1 desimal). Samakan dengan CardImage bila formatnya berbeda.
- Dot indikator carousel selebar 24px x tinggi 44px (bukan 44x44) agar delapan titik muat di 375px.
- Cache useFeatured hanya di memori modul (hilang saat reload); TTL 5 menit, dibersihkan saat Try again.
- `pnpm catalog:refresh` adalah skrip pemeliharaan sekali pakai (T1) untuk judul lama yang masih english. Setelah dijalankan di kedua perangkat, skrip, fungsi refreshCatalog, getAnimeBatches, dan tes-nya boleh dihapus.
- Wajib dilakukan sendiri: backup, lalu pnpm catalog:refresh --dry-run dan pnpm catalog:refresh di tiap perangkat.
- Detail belum tahu apakah anime sudah ada di list saat halaman dibuka: "In your list" muncul setelah menambah atau setelah server menjawab 409. API.md belum mencantumkan 409 untuk POST /anime. Cek daftar saat dibuka butuh keputusan terpisah (mis. GET /anime atau endpoint cek).
- Galat id tidak valid (400) pada GET /catalog/anime/:id ditampilkan sama dengan 404 ("Anime not found").
- ErrorApiPage masih memakai warna mentah (red-600, #666); dirapikan di D8.
- Tombol Trailer dan Bookmark di Detail hanya placeholder (tooltip "Coming soon"). Trailer menunggu keputusan apakah GET /catalog/anime/:id perlu meminta field trailer AniList (ubah backend dan API.md). Bookmark menunggu fitur bookmark.
- Sidebar Detail membaca season, seasonYear, popularity, favourites, source, studios, externalLinks dari GET /catalog/anime/:id; field yang tidak dikirim server tampil "-" (kotak External & Streaming links tersembunyi). Periksa respons; bila ada yang belum dikirim, query AniList di backend perlu diperluas (tugas backend terpisah, perbarui API.md).
- Relations dan Characters di Detail hanya kerangka ("Coming soon"), belum ada data.

## 9. Rencana Berikutnya (urutan disarankan)

1. Hapus 3 file Jikan dan baris comment-nya di `app.mjs`. Cari kata `jikan` di seluruh kode.(selesai)
2. Phase 0 #1 dan #2 (AuthProvider ganda, `VITE_API_URL`). Isi `frontend/.env.example`.(selesai)
3. Phase 0 #5 (DOMPurify) dan #7 (timeout + cache AniList).(selesai)
4. Phase 0 #4 (Zod): auth dan watchlist selesai.(selesai)
5. Perbaikan bug kecil backend (nama ganda register, 2 bug model).(selesai)
6. Phase 0 #6 (migrasi SQL, pisah anime_catalog dan user_anime). (selesai)
7. Frontend UX (chat terpisah): login langsung menampilkan navbar dan tab MyList; kata kunci pencarian di URL agar Back mengembalikan hasil.(selesai)
8. Pagination katalog. (selesai)
9. Filter kategori di Home (10 tab). (selesai)
10. Phase 0 #8 (test runner). Bagian A: selesai (28 tes auth lolos). Bagian B: tes watchlist + katalog (AniList di-mock).(selesai)
11. Backend cleanup kecil, bagian A dan B. (selesai)
12. C1, C2, C3 (selesai).
13. Phase 0 #3: 13A backend (selesai); 13B frontend (selesai); 13C backend (hapus Bearer dan token di body login).(selesai)
14. Rate limiter (login, katalog, POST /anime).(selesai)
15. Hapus tabel animes lama dan 2 stored procedure, rapikan project_akhir_blk.sql, cek db-project-test.sql (tugas terpisah).(selesai)
16. Refactor backend ke modules/ (16A sampai 16D). (selesai)
17. Phase 2 (profil dan follow): 2A, 2B, 2C, dan 2D. (selesai)
18. Fase desain: D1, D2, D3 (D3A sampai D3D) selesai; 18: D4 Detail selesai; berikutnya D5 MyList; D6 Profil + aksen (plus backend migrasi 006); D7 Login dan Register; D8 poles.
    18a. T1: judul anime romaji di katalog server dan skrip catalog:refresh. (selesai)
    18b. L1: terjemahan frontend (header, laci, footer, tema, Modal, halaman galat). (selesai, kecuali MainLayout.jsx)
    18c. L2A: terjemahan pesan server. (selesai) L2B: perbarui tes dan koleksi Bruno ke pesan Inggris. (selesai)
    18d. L3: pesan 500 generik di produksi (log lengkap tetap di server).
19. Phase 3 (posts, comments, likes, upload gambar, avatar dan banner).

## 10. Template Serah-Terima (tempel di akhir tiap tugas)

```
- **[tanggal]** — [nama tugas]
  - Selesai: ...
  - File diubah: ...
  - Keputusan baru: ...
  - Berikutnya: ...
```

## 11. Log

### Ringkasan riwayat (lengkap: docs/PROGRESS-ARSIP.md)

- Phase 0: audit, hapus Jikan, perbaikan keamanan (DOMPurify, Zod, cookie HttpOnly + CSRF + CORS, rate limiter), migrasi database, test runner, katalog diisi server dari AniList, UX katalog (pagination, filter, Back).
- Refactor: pensiun tabel animes (animes_legacy), modules/ (16A sampai 16D).
- Phase 2: profil dan follow (2A sampai 2D).
- Desain: DESIGN.md (D0), fondasi (D1), kerangka (D2).

- **2026-11-23** — D1 (fondasi desain)
  - Selesai: skrip tema inline di index.html (atribut data-theme di <html> sebelum React dimuat). utils/theme.js (mode system/light/dark, kunci localStorage "anisphere-theme" dengan try/catch, nilai tidak valid jadi system, mode system mengikuti prefers-color-scheme, sinkron antar tab) dan hook useTheme (useSyncExternalStore). Token warna per tema dan pemetaan @theme inline (kelas bg-canvas, bg-subtle, border-border, border-border-strong, text-fg, text-muted, text-accent, bg-accent-emphasis, text-on-accent, success, attention, danger, done). Aksen profil lewat [data-accent="violet|teal|orange|pink|green"] (--profile-accent, --profile-on-accent; kelas bg-profile-accent, text-profile-on-accent). components/common: icons.jsx (lucide-react), Button, Card, Input, Modal, Badge, Avatar, Skeleton, ThemeToggle. Halaman /design hanya mode dev.
  - File diubah: frontend/index.html, frontend/src/assets/styles/index.css, frontend/src/App.jsx, frontend/package.json, pnpm-lock.yaml
  - File baru: frontend/src/utils/{theme.js,cx.js}, frontend/src/hooks/useTheme.js, frontend/src/components/common/{icons,Button,Card,Input,Modal,Badge,Avatar,Skeleton,ThemeToggle}.jsx, frontend/src/pages/DesignPreview.jsx
  - Keputusan baru: variabel CSS berawalan --ds- (App.css lama memakai --accent dan --border). @custom-variant dark lama (berbasis .dark) dipertahankan agar halaman lama tidak berubah; varian baru bernama theme-dark (berbasis data-theme); D2 mengganti yang lama setelah ThemeProvider lama dihapus. color-scheme baru dipasang pada elemen non-html (pembungkus pratinjau), pada <html> baru saat D2. Pada tema gelap, teks putih di atas danger (#f85149) hanya sekitar 3,3:1, jadi Button danger memakai teks dan garis danger tanpa isian. border-strong terang #818b98 (3,46:1 terhadap canvas), gelap #656c76 (3,57:1). Badge memakai latar subtle dengan tepi bernada. Tidak ada perubahan backend atau API.md.
  - Berikutnya: D2 (header, navigasi ponsel dengan laci, footer, wadah halaman; ganti ThemeProvider lama dengan useTheme dan alihkan variant dark ke data-theme).
- **2026-11-23** — D2 (kerangka aplikasi dan penyatuan tema)
  - Selesai: sistem tema lama dihapus, semua lewat utils/theme.js dan hooks/useTheme.js. Migrasi sekali kunci theme ke anisphere-theme (di theme.js, dan dibaca saat first paint di index.html). @custom-variant dark kini berbasis data-theme, varian theme-dark dihapus, color-scheme dipasang di <html>, body memakai --ds-canvas dan --ds-fg, DEFAULT_MODE ditambahkan. Header baru (hamburger dan laci di semua lebar, logo, kolom cari di laptop, ikon cari dengan bar di bawah header di ponsel, ThemeToggle, menu avatar dengan tampilan tombol lama, tombol Masuk dan Daftar). Laci aksesibel (dialog, jebakan fokus, Esc, klik latar, gulir terkunci, fokus kembali ke pemicu, hormat reduced-motion). Pencarian header mengirim ke /?q= atau /. Footer dan MainLayout baru.
  - File diubah: frontend/index.html, frontend/src/main.jsx, frontend/src/utils/theme.js, frontend/src/hooks/useTheme.js, frontend/src/assets/styles/index.css, frontend/src/components/common/icons.jsx, frontend/src/layouts/MainLayout.jsx
  - File baru: frontend/src/components/common/{Header,NavDrawer,Footer,linkButtonClasses}.jsx/.js
  - File dihapus: context/{ThemeProvider.jsx, ThemeContext.js, useTheme.js}, components/common/{ThemeSwitcher.jsx, Navbar.jsx}, serta aset template dan UserProfileCard.jsx yang terbukti tidak dipakai
  - Keputusan baru: laci yang sama dipakai di laptop dan ponsel (menggantikan "header horizontal" di DESIGN.md). Laci dirender lewat portal ke document.body. Kolom cari header disinkronkan dari ?q= hanya saat di / (lewat key), bukan lewat effect. Lebar wadah memakai max-w-7xl (sama dengan 1280px). Tidak ada perubahan backend, API.md, rute, atau library.
  - Berikutnya: D3 (Home dan katalog; kolom cari milik Home disesuaikan dengan kolom cari header).
- **2026-11-24** — D3A (backend: data untuk Home baru)
  - Selesai: GET /api/catalog/anime/featured (publik, query apa pun 400, maks 8 item, banner diutamakan, diisi sampul extraLarge bila banner kurang dari 5, description teks biasa maks 220 karakter, cache 30 menit, penanganan 429/502/504 dan pembatas laju katalog sama dengan endpoint katalog lain). Rute dideklarasikan sebelum /anime/:id. Daftar katalog menambah genres (maks 3), season, seasonYear per item; kunci cache dan meta tidak berubah. Tes catalog-featured.test.mjs.
  - File diubah: src/integrations/anilist/{anilist.client.mjs,index.mjs}, src/modules/anime/{anime.controller,anime.routes,anime.validator}.mjs, API.md
  - File baru: src/integrations/anilist/anilist.format.mjs, tests/catalog-featured.test.mjs
  - Keputusan baru: cache featured satu slot terpisah dengan TTL 30 menit (clearCacheForTests membersihkan keduanya). Item tanpa banner diisi setelah item ber-banner (urutan trending di dalam tiap kelompok dipertahankan). description null bila kosong. genres hanya dipotong bila lebih dari 3. Tidak ada migrasi, perubahan frontend, atau library baru.
  - Berikutnya: D3B (Home: hero, kotak hasil, kartu grid memakai genres, season, seasonYear), lalu D3C (tampilan daftar) dan D3D (carousel dan panel forum).
- **2026-11-24** — D3B (Home: hero, kotak hasil, kartu grid, kontrol halaman)
  - Selesai: hero bg-subtle dengan lencana "Katalog Anime", judul beraksen, deskripsi, dan tab kategori di dalamnya; kolom cari, tombol Search, dan state pencarian dihapus dari Home (pencarian lewat header). Chip "Hasil untuk ..." dengan tautan hapus ke "/" (label "Hapus pencarian"). Kotak hasil (ikon, label, judul, Pagination; ponsel dua baris; tempat tombol tampilan untuk D3C). Pagination ikon ChevronLeft/Right dengan aria-label, "Halaman N" aria-live, target 44px. Grid 2/3/4/6 kolom. CardImage berbasis token (poster 2:3, lencana skor dan format memakai Badge, judul 2 baris, episode dan status). Loading memakai grid 12 Skeleton, kondisi kosong memakai Card.
  - File diubah: frontend/src/pages/Home.jsx, frontend/src/components/common/{icons.jsx, Pagination.jsx, FilterTabs.jsx, CardImage.jsx, DaftarAnime.jsx}
  - File baru: frontend/src/utils/animeLabels.js, frontend/src/components/common/AnimeGridSkeleton.jsx
  - Keputusan baru: Pagination punya prop announce; hanya instance atas yang aria-live agar tidak terbaca dua kali. Chip hasil berada di dalam FilterTabs (prop query). Efek hover kartu hanya perubahan warna tepi (tanpa overlay dan tanpa zoom). Label format dan status dipusatkan di animeLabels.js. Tidak ada perubahan backend, API.md, parameter URL, atau library.
  - Berikutnya: D3C (tampilan daftar, ?view=list, memakai genres, season, seasonYear), lalu D3D (carousel dan panel forum).
- **2026-11-25** — D3C (Home: tampilan grid dan daftar)
  - Selesai: tombol tampilan (grup dua tombol ikon, aria-pressed, target 44px) di kotak hasil; tata letak bilah: laptop judul kiri, tombol tampilan lalu Pagination kanan, ponsel dua baris. Parameter URL ?view=list (grid default, parameter dihilangkan; nilai lain dianggap grid). Pindah tampilan memakai replace dan tidak memicu pengambilan data; tab, chip hapus pencarian, dan Pagination mempertahankan view. Kartu daftar AnimeListItem (poster kiri, judul sebagai satu-satunya tautan membentang, baris Format, Status, Score, hingga 3 lencana genre). Kolom daftar 1/2/3 (default/md/lg), grid tetap 2/3/4/6. Teks Home, FilterTabs, Pagination, CardImage, dan animeLabels diterjemahkan ke Inggris; hero kembali ke teks Inggris. Judul anime AniList lewat getAnimeTitle (romaji, english, native, "Untitled").
  - File diubah: frontend/src/pages/Home.jsx, frontend/src/components/common/{icons.jsx, FilterTabs.jsx, Pagination.jsx, CardImage.jsx, DaftarAnime.jsx, AnimeGridSkeleton.jsx}, frontend/src/utils/{animeLabels.js, catalogFilters.js}
  - File baru: frontend/src/components/common/{AnimeListItem.jsx, ViewToggle.jsx}, frontend/src/utils/catalogLayout.js
  - Keputusan baru: semua URL katalog dibangun lewat buildCatalogPath (q menang atas filter; default dihilangkan). Kelas grid dan daftar ada di catalogLayout.js (duplikasi di bagian 8 selesai). Cincin fokus kartu daftar lewat has-[a:focus-visible] pada pembungkus; tautan judul tanpa outline sendiri. view tidak dikirim ke server. Tidak ada perubahan backend, API.md, atau library.
  - Berikutnya: D3D (carousel dan panel forum; carousel memakai getAnimeTitle), lalu D4 (Detail).
- **2026-11-25** — D3D (Home: baris unggulan, carousel, dan panel forum)
  - Selesai: baris unggulan di atas hero (hanya tanpa ?q= dan page = 1): grid lg 3 kolom (carousel 2 kolom, ForumPanel 1 kolom setinggi carousel; di bawah lg satu kolom). Carousel dari GET /catalog/anime/featured: scroll-snap tanpa batang gulir, slide aktif dilacak IntersectionObserver, slide tidak aktif inert; banner (fallback sampul extraLarge) dengan scrim gelap dan teks putih; lencana skor dan format; judul lewat getAnimeTitle; meta "Format · N eps · Status"; genre dan deskripsi hanya sm ke atas (teks biasa); tombol Details, + Watchlist, + Plan to Watch (target 44px) dengan pesan aria-live dan status "In your list". Kontrol: jeda/lanjut, titik, panah (terlihat dari lg, tetap bisa difokus), ArrowLeft/Right. Autoplay 6 detik, berhenti saat hover, fokus keyboard, sentuhan (menjeda), tab tersembunyi, atau dijeda; mati bila prefers-reduced-motion. Region dan slide beraria-label sesuai pola carousel. Loading = Skeleton setinggi sama; error = Card dengan Try again; kosong = carousel tidak tampil (panel forum selebar penuh). ForumPanel menerima posts = [] (tanpa data palsu). Pesan error di Home diterjemahkan ke Inggris.
  - File diubah: frontend/src/pages/Home.jsx, frontend/src/components/common/icons.jsx
  - File baru: frontend/src/features/anime/{useFeatured.js, FeaturedCarousel.jsx, FeaturedSlide.jsx, FeaturedRow.jsx}, frontend/src/features/watchlist/useAddToList.js, frontend/src/features/community/ForumPanel.jsx, frontend/src/hooks/usePrefersReducedMotion.js
  - Keputusan baru: useAddToList(externalId, status, title) mengembalikan { ok, message } atau null (diarahkan ke login atau request sedang berjalan); hanya mengirim { externalId, status }. Anonim diarahkan ke /login dengan state.from (pola FollowButton). useFeatured memakai cache modul TTL 5 menit dan AbortController. Hook data berada di FeaturedRow (tidak ada fetch di halaman 2 atau saat mencari). Sentuhan pada carousel menjeda autoplay lewat tombol jeda. Fokus menahan autoplay hanya untuk fokus keyboard (:focus-visible). AnimeDetail.jsx dialihkan ke useAddToList di D4. Tidak ada perubahan backend, API.md, atau library.
  - Berikutnya: D4 (Detail anime; getAnimeTitle dan useAddToList dipakai di sana), lalu D5 sampai D8.
- **2026-11-25** — T1 (judul anime romaji di katalog server)
  - Selesai: aturan judul katalog romaji, lalu english, lalu native (satu fungsi pickTitle di modules/anime, dipakai saat mengisi dan menyegarkan katalog). anim_title di watchlist kini romaji. getAnimeBatches di integrations/anilist (id_in per 50 id, jeda 2,5 detik, retry terbatas untuk 429 dengan Retry-After). refreshCatalog di modules/anime dan CLI src/db/refresh-catalog.mjs (pnpm catalog:refresh, opsi --dry-run; memperbarui title, gambar, total episode, tipe, synced_at; baris yang tidak ditemukan di AniList tidak disentuh; ringkasan diperbarui/tidak berubah/tidak ditemukan/gagal; exit code 1 bila ada yang gagal). Tes catalog-refresh.test.mjs.
  - File diubah: backend/src/modules/anime/{catalog.service.mjs,index.mjs}, backend/src/integrations/anilist/{anilist.client.mjs,index.mjs}, backend/package.json, backend/tests/watchlist.test.mjs (tiga tes: judul katalog "Desu Nōto", tabel urutan judul, anim_title "Romaji 1535"), API.md
  - File baru: backend/src/modules/anime/catalog.refresh.service.mjs, backend/src/db/refresh-catalog.mjs, backend/tests/catalog-refresh.test.mjs
  - Keputusan baru: semua judul anime ditampilkan romaji; urutan judul katalog romaji, english, native. Error 429 dari AniList membawa retryAfterSeconds. Fungsi batch tidak memakai cache dan tidak memfilter konten dewasa. Tanpa migrasi, perubahan frontend, atau library baru.
  - Berikutnya: D4 (Detail anime; getAnimeTitle dan useAddToList dipakai di sana), lalu D5 sampai D8.
- **2026-11-26** — L1 (terjemahan frontend: kerangka)
  - Selesai: teks Header, NavDrawer, Footer, ThemeToggle, Modal, ErrorApiPage diterjemahkan ke Inggris (label, tombol, placeholder, aria-label, sr-only). index.html: lang="en", title AniSphere. formatDate kini mengeluarkan "Nov 25, 2026" (en-US, UTC); tanggal tanpa hari menjadi "Nov 2026", tanpa bulan menjadi "2026" (sebelumnya diisi 01). LoadingPage, NotFound, dan Avatar tidak butuh perubahan.
  - File diubah: frontend/index.html, frontend/src/utils/formatDate.js, frontend/src/components/common/{Header,NavDrawer,Footer,ThemeToggle,Modal,ErrorApiPage}.jsx
  - Keputusan baru: padanan teks mengikuti daftar L1 (Home, My List, My profile, Edit profile, Log in, Sign up, Log out, Theme, Light/Dark/System). aria-label akun: "Account menu for <username>". Tidak ada perubahan rute, parameter URL, prop, backend, API.md, atau library.
  - Berikutnya: terjemahkan layouts/MainLayout.jsx ("Skip to content"), L2 (pesan server), lalu D4 (Detail anime).
- **2026-11-26** — L2A (terjemahan pesan server ke bahasa Inggris)
  - Selesai: semua pesan yang bisa sampai ke respons HTTP menjadi Inggris: AppError, pesan kustom Zod, pesan sukses controller, middleware (auth, CSRF, validate, strict options), pembatas laju, dan klien AniList. Teks root "/" ikut diterjemahkan. Grep frontend untuk pembandingan teks pesan: kosong. Tanpa perubahan kode status, nama field, urutan validasi, atau library.
  - File diubah: backend/src/app.mjs, src/middlewares/{auth,csrf,validate}.middleware.mjs, src/config/rateLimit.mjs, src/utils/validation.mjs, src/integrations/anilist/anilist.client.mjs, src/modules/anime/{anime.controller,anime.validator,catalog.service}.mjs, src/modules/auth/{auth.controller,auth.service,auth.validator}.mjs, src/modules/users/{users.service,users.validator}.mjs, src/modules/watchlist/{watchlist.controller,watchlist.model,watchlist.validator}.mjs, API.md
  - Keputusan baru: gaya pesan = kalimat singkat, huruf besar di awal, tanpa titik akhir. Label Zod memakai nama manusiawi (External ID, Episodes, Privacy setting). Password dipecah per aturan. Konstanta USER_NOT_FOUND, NOT_IN_LIST, externalIdMsg. rateLimit.mjs punya helper formatWait (detik bila < 60 dtk, selain itu menit); subject limiter berbahasa Inggris. Pesan 401 dibedakan: "Authentication required" (tanpa cookie) dan "Session is invalid or has expired".
  - Berikutnya: L2B (tes Supertest dan koleksi Bruno), lalu D4 (Detail anime).
- **2026-11-27** — D4 (Detail anime)
  - Selesai: pemecahan AnimeDetail.jsx (355 baris) menjadi hook dan komponen. Hero: strip banner (h-40 sm:h-56 lg:h-64, fallback bg-subtle dengan gradien dari coverImage.color bila valid #RRGGBB), lapisan bawah menyatu ke canvas, poster menjorok ke bawah strip (di atas judul di ponsel, di kiri judul di lg), H1 romaji lewat getAnimeTitle, judul alternatif (english dan native bila berbeda), lencana format, status (nada sesuai status), skor (averageScore / 10, 1 desimal) dan genre. Tombol "+ Watchlist" dan "+ Plan to Watch" lewat useAddToList (anonim ke /login dengan state.from, penjaga klik ganda, pesan aria-live); tombol yang dipakai menjadi "In your list" dan nonaktif, juga untuk jawaban 409. Sinopsis (DOMPurify, daftar tag sama) dan Information (grid 2 kolom, 4 di lg; nilai kosong "-") dalam Card. Loading = Skeleton yang meniru tata letak, error = ErrorApiPage + "Back to home", 404 dan 400 = "Anime not found". Tombol Back (ikon ChevronLeft, 44px) berperilaku sama seperti sebelumnya. document.title = "<judul> - AniSphere", dipulihkan saat dilepas.
  - File diubah: frontend/src/pages/AnimeDetail.jsx, frontend/src/features/watchlist/useAddToList.js
  - File baru: frontend/src/features/anime/{useAnimeDetail.js, AnimeHero.jsx, AnimeSynopsis.jsx, AnimeInfoGrid.jsx, AnimeDetailSkeleton.jsx}
  - Keputusan baru: useAnimeDetail menyimpan hasil bersama kunci id (data lama tidak tampil saat id berubah) dan membatalkan permintaan lewat AbortController. useAddToList menambah field alreadyInList (status 409) pada hasil galat; bentuk hasil lain tidak berubah. Judul utama Detail kini romaji (sebelumnya english dahulu). Label format dan status dari animeLabels.js (status "Not yet released", bukan "Upcoming"). Tidak ada perubahan backend, API.md, rute, atau library.
  - Berikutnya: D5 (MyList).
- - **2026-11-27** — D4b (revisi hero Detail)
  - Selesai: kartu skor (teks "Score 9.0" dan 5 bintang, bintang separuh) di kanan hero, hanya dari lg; di bawah lg kembali ke lencana skor kecil. Di bawah poster ada dua tombol ikon (Trailer: danger bergaris, Bookmark: secondary dengan ikon accent) berupa placeholder dengan tooltip "Coming soon" (hover, fokus, dan tap). Di bawah lg poster, teks, lencana, genre, dan tombol diratakan tengah; di lg tetap rata kiri. Kotak poster tidak lagi meregang (self-start).
  - File diubah: frontend/src/features/anime/AnimeHero.jsx, frontend/src/components/common/icons.jsx
  - File baru: frontend/src/features/anime/{AnimeScoreCard.jsx, ComingSoonButton.jsx}
  - Keputusan baru: bintang = averageScore / 20; pecahan di bawah 0,25 turun, 0,25 sampai 0,75 jadi setengah, di atas 0,75 naik. Tooltip berbahasa Inggris sesuai PRD aturan 12. Tidak ada perubahan backend, API.md, rute, atau library.
  - Berikutnya: revisi Sinopsis dan Information (prompt berikutnya), lalu D5 (MyList).
- **2026-11-27** — D4c (tata letak dua kolom Detail)
  - Selesai: dari lg, sidebar kiri (Information sebagai daftar vertikal: Format, Episodes, Duration, Status, Start Date, End Date, Season, Source, Studios, AniList Score, Popularity, Favorites; lalu kotak External & Streaming links bila ada) dan kolom kanan (Synopsis, Relations, Characters). Di bawah lg satu kolom: Synopsis, Information, Relations, Characters. Sinopsis tidak lagi dibatasi lebar. Relations dan Characters berupa kerangka dengan teks "Coming soon". Tautan eksternal hanya http(s), buka di tab baru dengan rel noopener noreferrer nofollow, yang isDisabled dilewati.
  - File diubah: frontend/src/pages/AnimeDetail.jsx, frontend/src/features/anime/{AnimeSynopsis,AnimeDetailSkeleton}.jsx, frontend/src/utils/animeLabels.js, frontend/src/components/common/icons.jsx
  - File baru: frontend/src/features/anime/{AnimeInfoSidebar,AnimeExternalLinks,AnimeRelations,AnimeCharacters}.jsx
  - File dihapus: frontend/src/features/anime/AnimeInfoGrid.jsx
  - Keputusan baru: studio animasi diutamakan, selain itu semua studio. Field yang tidak dikirim server tampil "-". Tidak ada perubahan backend, API.md, rute, atau library.
  - Berikutnya: D5 (MyList).
