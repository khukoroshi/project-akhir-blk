# PROGRESS.md — AniSphere

> Baca file ini di awal setiap chat. Perbarui setiap selesai satu tugas.
> Snapshot awal dibuat 2026-11-01 dari `project-akhir-blk-main.zip` (kode per 2026-09-21).
> Target lengkap ada di PRD (`product_requirement_document_prd.md`). File ini hanya mencatat KONDISI SAAT INI.

## 1. Posisi Saat Ini

- **Phase aktif:** Phase 0 (perbaikan fondasi), sebagian selesai (#1, #2, #4, #5, #6, #7, hapus Jikan, UX katalog, #8). Tersisa #3.
- **Sedang dikerjakan:** -
- **Berikutnya:** katalog diisi server dari AniList (opsi C; tiga chat: C1 backend, C2 frontend, C3 rapikan kontrak), lalu #3 cookie HttpOnly (termasuk CORS).

## 2. Stack Aktual (sesuai repo)

- **Frontend:** React 19, Vite 8, Tailwind CSS 4 (`@tailwindcss/vite`), React Router 7, Axios, React Compiler. Package manager: pnpm.
- **Backend:** Node.js (ESM, file `.mjs`), Express 5, MySQL (`mysql2`), JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`, `axios`. Dev: `nodemon`, Vitest, Supertest.
- **Belum terpasang:** rate limiter, cookie-parser.
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
- Katalog (anime_catalog) dibagi antar user dan diisi SERVER dari AniList berdasarkan externalId (keputusan opsi C, 2026-11-10), bukan dari body klien. Total episode untuk aturan completed dan batas episode selalu dari katalog. Berlaku penuh setelah chat C1 selesai; sebelum itu katalog masih diisi dari body user pertama.
- Katalog: perPage 48 ditentukan server; daftar top (semua filter) maks 10 halaman; filter hanya berlaku tanpa q (klik tab menghapus q, mencari menghapus filter). q, page, dan filter disimpan di URL.
- Dua perangkat (Windows dan Linux): .env, .env.test, isi database, dan node_modules per perangkat, tidak ikut git. Setelah git pull: pnpm install bila package.json/lockfile berubah; pnpm migrate (backup dulu) bila ada file migrasi baru. Database test (AniWatchList_test) dibuat manual di tiap perangkat.
- Semua respons error API memakai status "error" (bukan "fail"). POST /auth/register mengembalikan us_id.
- Tes backend: black box lewat Supertest berdasarkan API.md; hanya jalan di database berakhiran \_test; tidak boleh memanggil internet (AniList di-mock). Temuan yang belum diputuskan ditandai it.fails, bukan diperbaiki diam-diam.

## 4. Struktur Saat Ini (belum sesuai target)

**Backend** (berlapis per jenis file, BUKAN modular):
`src/{config, controllers, db (migrate.mjs, migrations/), middlewares, models, routes, services, utils, validators ({auth,anim,anilist}.validator.mjs)}`

- Fitur yang ada: `auth`, `anim` (watchlist), `anilist` (katalog), `user` (service/model saja, tanpa route).
- `backend/public/` berisi frontend statis lama (HTML/JS/CSS), kemungkinan sudah tidak dipakai.
- `backend/api_test/` berisi koleksi uji endpoint (format YAML).
- `Test backend`: backend/vitest.config.mjs, backend/tests/ (base-schema.sql, global-setup.mjs, setup.mjs, auth.test.mjs, support/), tests/{watchlist,catalog}.test.mjs.

**Frontend:**
`src/{components/common, components/features/{anime,aunt,user}, context, layouts, pages, services, utils}`

- Halaman: `Home`, `MyList` (protected), `AnimeDetail`, `NotFound`. Login dan Register berupa komponen form yang dipakai langsung sebagai route.
- Target `features/` dari PRD belum dibuat. Folder `aunt` kemungkinan typo dari `auth`.
- Frontend katalog: `components/common/{Pagination,DaftarAnime,FilterTabs}.jsx`, `utils/catalogFilters.js` (daftar filter, harus sama dengan validator backend).

## 5. Endpoint yang Sudah Ada

| Method | Path                            | Auth  | Keterangan                                                             |
| ------ | ------------------------------- | ----- | ---------------------------------------------------------------------- |
| POST   | `/api/auth/register`            | tidak | daftar                                                                 |
| POST   | `/api/auth/login`               | tidak | token JWT dikirim di body response                                     |
| GET    | `/api/auth/profile`             | ya    | profil dari JWT                                                        |
| GET    | `/api/anime`                    | ya    | seluruh watchlist user                                                 |
| GET    | `/api/anime/:anim_id`           | ya    | satu item watchlist                                                    |
| POST   | `/api/anime`                    | ya    | tambah ke watchlist                                                    |
| PUT    | `/api/anime/:anim_id`           | ya    | ubah item                                                              |
| PATCH  | `/api/anime/:anim_id/increment` | ya    | tambah episode                                                         |
| DELETE | `/api/anime/:anim_id`           | ya    | hapus item                                                             |
| GET    | `/api/catalog/anime`            | tidak | daftar top (10 filter) dan pencarian, berpaginasi (?q, ?page, ?filter) |
| GET    | `/api/catalog/anime/:id`        | tidak | detail anime (AniList)                                                 |

Catatan: path PRD (`/api/watchlist`, `/api/anime/search`, `/api/auth/me`) berbeda dari yang ada sekarang. Putuskan nanti apakah diganti atau PRD yang disesuaikan.

## 6. Database Saat Ini

- Database `AniWatchList`. Tabel: `users`, `animes` (lama, cadangan, tidak dipakai kode), `anime_catalog`, `user_anime`, `schema_migrations`.
- `users` tetap memakai nama kolom lama (`us_id`, `us_name`, `us_email`, `us_password`, `us_created_at`). Semua foreign key baru mengarah ke `users.us_id` dan bertipe INT UNSIGNED.
- `user_anime.id` = `anim_id` lama, jadi ID di URL tidak berubah. `anime_catalog` punya kolom `anim_type` (TV/Movie/OVA/ONA/Special/TV Short/Music).
- sp_insert_anime dan sp_update_anime masih ada di database tetapi tidak dipakai kode.
- Instalasi baru: jalankan `project_akhir_blk.sql`, lalu `pnpm migrate`. Backup sebelum migrasi: `mysqldump`.
- Tabel komunitas PRD (posts, comments, dst.) belum ada.
- File: `backend/src/db/project_akhir_blk.sql`, `db-project-test.sql` (lama), `migrations/001_create_anime_catalog_and_user_anime.sql`, `migrations/002_sync_leftover_animes.sql`.
- Database test terpisah `AniWatchList_test` (dibuat manual di tiap perangkat). JANGAN menjalankan project_akhir_blk.sql mentah di dalamnya; skema dasar test ada di backend/tests/base-schema.sql.

## 7. Status Checklist Phase 0

Status hasil pemeriksaan kode, bukan asumsi.

| #   | Item                   | Status      | Temuan                                                                                                                                                   |
| --- | ---------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | AuthProvider ganda     | [x] SELESAI | Tersisa satu di `main.jsx`.                                                                                                                              |
| 2   | URL API hardcode       | [x] SELESAI | `api.js` memakai `VITE_API_URL`. `.env.example` terisi.                                                                                                  |
| 3   | JWT di cookie HttpOnly | [ ] BELUM   | Token di `localStorage` (`api.js`, `AuthProvider.jsx`). Backend membaca header `Authorization: Bearer`.                                                  |
| 4   | Validasi Zod           | [x] SELESAI | Auth dan watchlist (param, POST, PUT) divalidasi strict di `validators/`.                                                                                |
| 5   | Sanitasi HTML          | [x] SELESAI | DOMPurify, whitelist tag dasar, tanpa atribut.                                                                                                           |
| 6   | Migrasi DB aman        | [x] SELESAI | Kode watchlist memakai anime_catalog + user_anime. Tabel animes lama jadi cadangan.                                                                      |
| 7   | standarkan AniList     | [x] SELESAI | Timeout 10 detik, cache memori 5 menit, pesan error 429/502/504.                                                                                         |
| 8   | Test runner            | [x] SELESAI | Vitest + Supertest, database test AniWatchList_test, ~28 tes auth, ~93 tes watchlist, ~51 tes katalog (AniList di-mock). Tidak ada tes it.fails tersisa. |

## 8. Utang Teknis & Kebersihan

- `cors()` terbuka untuk semua origin.
- `frontend/penyimpanan.txt` berisi salinan kode lama (scratch), hapus dari repo.
- `frontend/package.json` bernama `react-starter-kit`, ganti jadi `anisphere-frontend`.
- Nama file dan komentar campur Indonesia dan Inggris (`anim`, `aunt`). Rapikan saat refactor modul.
- Daftar filter katalog ada di dua tempat (validator backend dan frontend/src/utils/catalogFilters.js). Jaga tetap sama.
- Setelah #6, cek apakah db-project-test.sql masih relevan (tabel animes lama tidak dipakai lagi), dan hapus tabel animes lama lewat tugas tersendiri setelah verifikasi.
- project_akhir_blk.sql masih membuat animes dan 2 procedure (dibutuhkan migrasi 001 pada instalasi baru). Rapikan saat tabel animes dihapus.
- backend/tests/base-schema.sql menyalin skema users dan animes dari project_akhir_blk.sql. Hapus saat tabel animes lama dihapus (langkah 13).
- Auth masih memakai sp_insert_user. Tugas #13 (hapus procedure lama) jangan menghapusnya, hanya sp_insert_anime dan sp_update_anime.
- auth.service.mjs membaca us_id ?? new_us_id dari sp_insert_user. Hapus fallback new_us_id setelah memastikan procedure di database asli mengembalikan us_id.
- Katalog masih diisi dari body request user pertama dan PUT memakai teps dari klien (eps bisa melebihi total katalog, completed bisa dipalsukan). Diputuskan opsi C: server mengisi katalog dari AniList (chat C1, C2, C3). Temuan: PUT TIDAK mengubah anime_catalog.total_episodes.
- Perilaku belum tercatat di API.md: isi data pada respons DELETE; hasil PATCH saat episode sudah sama dengan total; anim_current_episode pada POST berstatus completed.
- Batas minimal JWT_SECRET (16) ada di dua tempat (env.mjs dan tests/support/env.mjs), jaga tetap sama.

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
12. Katalog diisi server dari AniList (opsi C): C1 backend (+ migrasi 003, field lama diabaikan), C2 frontend (berhenti mengirim title, imgUrl, totalEps, type, teps), C3 backend (hapus field lama dari schema).
13. Phase 0 #3 (cookie HttpOnly + CSRF + CORS).
14. Hapus tabel animes lama dan 2 stored procedure, rapikan project_akhir_blk.sql, cek db-project-test.sql (tugas terpisah).
15. Refactor backend ke `modules/` per fitur, lalu lanjut Phase 2 PRD.

## 10. Template Serah-Terima (tempel di akhir tiap tugas)

```
### [tanggal] — [nama tugas]
- Selesai: ...
- File diubah: ...
- Keputusan baru: ...
- Berikutnya: ...
```

## 11. Log

- **2026-11-01**: PROGRESS.md dibuat dari audit repo.
- **2026-11-02**: File Jikan dihapus (controller, service, routes).
- **2026-11-02** — Phase 0 poin 1 dan 2
  - Selesai: AuthProvider ganda dihapus (sisa di main.jsx). baseURL memakai VITE_API_URL. .env.example terisi.
  - File diubah: frontend/src/App.jsx, frontend/src/services/api.js, frontend/.env.example
  - Keputusan baru: wajib membuat frontend/.env lokal dari .env.example.
  - Berikutnya: Phase 0 #5 dan #7.
- **2026-11-02** — Phase 0 poin 5 (sanitasi HTML)
  - Selesai: deskripsi anime di AnimeDetail.jsx disanitasi dengan DOMPurify (whitelist tag dasar, tanpa atribut).
  - File diubah: frontend/src/pages/AnimeDetail.jsx, frontend/package.json, pnpm-lock.yaml
  - Keputusan baru: HTML dari API eksternal hanya boleh tag format dasar (br, i, b, em, strong, p, ul, ol, li).
  - Berikutnya: Phase 0 #7 (timeout + cache AniList).
- **2026-11-02** — Phase 0 poin 7 (timeout + cache AniList)
  - Selesai: timeout 10 detik, cache in-memory (TTL 5 menit, maks 200 entri), pesan jelas untuk 429/502/504, validasi ID detail. requestAniList disatukan untuk search dan detail.
  - File diubah: backend/src/services/anilist.service.mjs
  - Keputusan baru: cache hanya di memori proses (hilang saat restart, tidak dibagi antar instance). Jika nanti butuh banyak instance, pindah ke Redis.
  - Berikutnya: Phase 0 #4 (Zod, mulai dari auth lalu watchlist).
- **2026-11-03** — Phase 0 poin 4 (Zod, cakupan auth)
  - Selesai: middleware validate(schema) reusable; schema register dan login (strict); dipasang di POST /register dan /login. Zod terpasang di backend.
  - File diubah: backend/src/middlewares/validate.middleware.mjs (baru), backend/src/validators/auth.validator.mjs (baru), backend/src/routes/auth.routes.mjs, backend/package.json, pnpm-lock.yaml
  - Keputusan baru: validator ada di backend/src/validators/. Pesan error validasi dalam bahasa Indonesia. Body hasil validasi menggantikan req.body.
  - Berikutnya: Zod untuk watchlist (POST/PUT/PATCH /anime), lalu pastikan form Register frontend tidak mengirim field asing. Update checklist #4 jadi sebagian selesai.
- **2026-11-04** — Phase 0 poin 4 (Zod, cakupan watchlist)
  - Selesai: validate(schema, source) mendukung body/params/query (params/query tanpa menimpa). Schema anim_id, POST, PUT. Terpasang di semua route /anime ber-:anim_id plus POST dan PUT. Item #4 SELESAI.
  - File diubah: backend/src/middlewares/validate.middleware.mjs, backend/src/validators/anim.validator.mjs (baru), backend/src/routes/anim.routes.mjs
  - Keputusan baru: type tidak peka huruf besar/kecil (MOVIE -> Movie). PUT tetap full-update, status wajib. strictOptions diduplikasi di dua validator (bisa dipindah ke file bersama saat refactor modul). Cek externalId/title di controller sekarang redundan, belum dihapus.
  - Berikutnya: (1) terapkan 3 perubahan kecil EditAnimeModal (step, maxLength, teps ?? 0) dan putuskan pemetaan TV_SHORT/MUSIC di AnimeDetail; (2) form Register jangan kirim confirmPassword; (3) perbaiki 2 bug model: incrementEpisode tanpa teps dan completed dengan teps 0 mereset eps; (4) Phase 0 #6 migrasi SQL.
  - Terverifikasi: AnimeCard dan EditAnimeModal kompatibel dengan schema strict (tidak ada field asing). AnimeList dan AnimeTable tidak mengirim body sendiri.
- **2026-11-05** — Perbaikan bug kecil backend
  - Selesai: register menangani ER_DUP_ENTRY (400 "Nama sudah digunakan" / "Email sudah digunakan"); updateWatchList hanya menyetel eps = teps jika completed DAN teps > 0; incrementEpisode mengirim teps dan tanpa nilai undefined; cek manual externalId/title di controller createWatchList dihapus.
  - File diubah: backend/src/services/auth.service.mjs, backend/src/models/anim.model.mjs, backend/src/controllers/anim.controller.mjs, API.md
  - Keputusan baru: nama kunci unik dibaca dari pesan error MySQL (akhiran us_name / us_email). Jika kunci tidak dikenali, pesan umum "Nama atau email sudah digunakan". Migrasi #6 jangan mengganti nama kedua kunci ini tanpa memperbarui auth.service.
  - Berikutnya: Phase 0 #6 (migrasi SQL tanpa DROP, pisah anime_catalog dan user_anime, tambah nilai TV_SHORT/MUSIC).
- **2026-11-05** — Phase 0 #6 bagian A (struktur database)
  - Selesai: project_akhir_blk.sql tanpa DROP DATABASE (hanya instalasi baru); runner migrasi (pnpm migrate) dengan tabel schema_migrations; migrasi 001 membuat anime_catalog dan user_anime lalu menyalin data dari animes. Tabel animes lama tidak diubah.
  - File diubah: backend/src/db/project_akhir_blk.sql, backend/src/db/migrate.mjs (baru), backend/src/db/migrations/001_create_anime_catalog_and_user_anime.sql (baru), backend/package.json
  - Keputusan baru: anime_catalog memakai nama kolom PRD plus anim_type (ENUM TV/Movie/OVA/ONA/Special/TV Short/Music); external_id INT UNSIGNED; status memakai spasi ('plan to watch', 'on hold', 'rewatching'), PRD perlu disesuaikan; score DECIMAL(3,1) CHECK 1-10, tier ENUM S-D; user_anime.id = anim_id lama; user_anime punya created_at; konflik katalog diambil dari anim_id terbesar; baris non-anilist di-skip. File migrasi tidak boleh memakai DELIMITER, harus idempotent, tanpa DROP/TRUNCATE. Urutan instalasi baru: project_akhir_blk.sql lalu pnpm migrate.
  - Berikutnya: bagian B (model/controller membaca user_anime + anime_catalog dengan alias agar bentuk objek Anime tetap; decimalNumbers: true; Zod score desimal; update API.md). Tabel animes lama dihapus lewat tugas terpisah setelah terverifikasi. Ubah PRD: status bergaya spasi, score DECIMAL.
- **2026-11-05** — Phase 0 #6 bagian B (kode ke tabel baru)
  - Selesai: model watchlist membaca/menulis user_anime + anime_catalog (query biasa dalam transaksi, tanpa procedure baru); alias SELECT menjaga bentuk objek Anime; decimalNumbers: true di db.mjs; validator menerima 'TV Short' dan 'Music' (TV_SHORT dinormalisasi) dan score desimal 1-10 (maks 1 desimal); migrasi 002 menyalin data tertinggal. Item #6 SELESAI.
  - File diubah: backend/src/models/anim.model.mjs, backend/src/validators/anim.validator.mjs, backend/src/config/db.mjs, backend/src/db/migrations/002_sync_leftover_animes.sql (baru), API.md
  - Keputusan baru: katalog dibagi antar user dan tidak ditimpa saat anime sama ditambah user lain. Auto-complete memakai total dari katalog. sp_insert_anime dan sp_update_anime tidak dipanggil lagi (belum dihapus). Tabel animes lama tetap sebagai cadangan.
  - Berikutnya: Phase 0 #3 (cookie HttpOnly) dan #8 (test runner). Ubah PRD: status bergaya spasi, score DECIMAL(3,1). Tugas terpisah: hapus tabel animes lama dan 2 procedure setelah verifikasi, lalu cek db-project-test.sql.
- **2026-11-06** — Frontend kecil (skor desimal, EditAnimeModal, Register)
  - Selesai: input skor EditAnimeModal menerima desimal (step 0.1); teps selalu angka (?? 0). Terverifikasi tanpa perubahan: maxLength catatan 2000, step episode 1, RegisterForm hanya kirim name/email/password, tampilan skor di AnimeCard dan AnimeTableRow aman untuk desimal.
  - File diubah: frontend/src/components/features/anime/EditAnimeModal.jsx, frontend/src/components/features/aunt/RegisterForm.jsx (validasi password 8+ karakter, huruf dan angka, sesuai API.md)
  - Keputusan baru: validasi password frontend mengikuti kontrak API.md.
  - Berikutnya: frontend UX (login langsung tampil navbar dan MyList, kata kunci pencarian di URL), lalu pagination katalog, lalu #8 test runner.
- **2026-11-06** — Frontend UX (login state, kata kunci di URL)
  - Selesai: LoginForm membaca data.user (bukan userInfo), console.log respons login dan log objek error dihapus (berisi token/password). Home memakai useSearchParams (?q=) sebagai sumber kebenaran; input disinkronkan saat URL berubah; fetch memakai flag ignore untuk mencegah race condition.
  - File diubah: frontend/src/components/features/aunt/LoginForm.jsx, frontend/src/pages/Home.jsx
  - Keputusan baru: setiap pencarian menambah entri riwayat browser (Back berpindah antar pencarian). Pencarian kosong menghapus ?q=. Pagination nanti memakai ?page= di URL yang sama.
  - Berikutnya: cek tombol kembali di AnimeDetail.jsx (jika Link to="/", ganti navigate(-1)); pagination katalog (backend + frontend, perbarui API.md); lalu #8 test runner.
- **2026-11-07** — Pagination katalog (backend + frontend)
  - Selesai: GET /catalog/anime menerima ?page= (1-200, divalidasi Zod strict, perPage tetap 48). Satu request AniList per halaman, kunci cache memuat page. Response menambah meta { page, perPage, hasNextPage }. Daftar top maks 10 halaman (400 jika lebih, hasNextPage false di halaman 10). Komponen Pagination (Sebelumnya / Halaman X / Berikutnya), Home menyimpan ?q= dan ?page= di URL dan gulir ke atas saat pindah halaman. Grid: 2 kolom (hp), 3 (tablet), 4 (laptop), 6 (desktop).
  - File diubah: backend/src/validators/anilist.validator.mjs (baru), backend/src/routes/anilist.routes.mjs, backend/src/controllers/anilist.controller.mjs, backend/src/services/anilist.service.mjs, frontend/src/components/common/Pagination.jsx (baru), frontend/src/components/common/DaftarAnime.jsx, frontend/src/pages/Home.jsx, API.md
  - Keputusan baru: perPage hanya ditentukan server. Daftar top dibatasi 10 halaman (480 judul). Tombol kembali AnimeDetail sudah benar, tidak diubah. strictOptions kini diduplikasi di tiga validator (utang teknis).
  - Berikutnya: filter kategori Home (10 tab, ?filter=) memakai pagination ini, lalu #8 test runner, lalu #3 cookie HttpOnly. PRD bagian 2.2 punya dua baris "Pagination katalog", hapus baris lama dan centang yang baru.
- **2026-11-07** — Filter kategori katalog Home
  - Selesai: GET /catalog/anime menerima ?filter= (enum Zod, default all), dipetakan di server ke status/format/urutan AniList dengan isAdult: false. Filter diabaikan jika q ada. Cache key: top:<filter>:<page>. Frontend: komponen FilterTabs (nav + Link, aria-current, scroll horizontal), filter di URL bersama q/page. Klik tab menghapus q dan reset page; mencari menghapus filter.
  - File diubah: backend/src/validators/anilist.validator.mjs, backend/src/services/anilist.service.mjs, backend/src/controllers/anilist.controller.mjs, frontend/src/pages/Home.jsx, frontend/src/components/common/FilterTabs.jsx (baru), frontend/src/utils/catalogFilters.js (baru), API.md
  - Keputusan baru: daftar filter ada di dua tempat (validator backend dan catalogFilters.js frontend), jaga tetap sama. filter tidak valid di URL dianggap "all" di frontend. Pencarian (q) belum memakai isAdult: false (tugas kecil berikutnya). Semua filter tetap dibatasi 10 halaman.
  - Berikutnya: #8 test runner (Vitest + Supertest), lalu #3 cookie HttpOnly. PRD 2.2: centang filter katalog, hapus baris "Pagination katalog" yang lama, centang yang baru.
- **2026-11-07** — Pagination ganda di Home
  - Selesai: teks "Popular anime" diganti Pagination di kanan judul katalog (atas), pagination bawah tetap. Pagination menerima prop className dan label.
  - File diubah: frontend/src/components/common/Pagination.jsx, frontend/src/pages/Home.jsx
  - Keputusan baru: tidak ada perubahan API.
  - Berikutnya: #8 test runner, lalu #3 cookie HttpOnly.
- **2026-11-08** — Phase 0 #8 bagian A (infrastruktur test + tes auth)
  - Selesai: Vitest + Supertest; database AniWatchList_test; global setup menolak jalan jika MYSQL_DATABASE tidak berakhiran "\_test" (dicek ulang di setiap worker dan sebelum DELETE); base-schema.sql (users, animes, sp_insert_user) + migrasi dijalankan otomatis; pembersihan antar tes dengan DELETE; fetch di-stub agar tes tidak memanggil jaringan; 28 tes auth lolos, 2 temuan ditandai it.fails.
  - File diubah: backend/src/db/migrate.mjs (diekspor jadi runMigrations/createConnectionFromEnv, CLI pnpm migrate tetap sama), backend/package.json, .gitignore.
  - File baru: backend/vitest.config.mjs, backend/.env.test.example, backend/tests/{base-schema.sql, global-setup.mjs, setup.mjs, auth.test.mjs}, backend/tests/support/{env,guard,db,helpers}.mjs
  - Keputusan baru: file tes tidak berjalan paralel (satu database bersama). Env test dibaca dari .env.test. Variabel database proyek adalah MYSQL_DATABASE (bukan DB_NAME). Tidak ada perubahan API (API.md belum diubah, menunggu keputusan temuan #1 dan #2).
  - Berikutnya: putuskan temuan #1 dan #2, lalu #8 bagian B (watchlist + katalog, AniList di-mock), centang "Backend Test Runner" di PRD 2.1 setelah bagian B, lalu #3 cookie HttpOnly.
- **2026-11-09** — Perbaikan temuan tes #1 dan #2 (opsi B)
  - Selesai: AppError selalu bernilai status "error"; register mengembalikan us_id (penyebab: service membaca kolom new_us_id, procedure mengembalikan us_id). Tes penanda it.fails dihapus, expectError kembali memeriksa body.status. 28 tes auth lolos.
  - File diubah: backend/src/utils/appError.mjs, backend/src/services/auth.service.mjs, backend/tests/auth.test.mjs, API.md (log saja)
  - Keputusan baru: semua respons error memakai status "error". Fallback new_us_id sementara, hapus setelah SHOW CREATE PROCEDURE di database asli terverifikasi.
  - Berikutnya: #8 bagian B (tes watchlist + katalog, AniList di-mock), lalu centang "Backend Test Runner" di PRD 2.1, lalu #3 cookie HttpOnly.
- **2026-11-09** — Phase 0 #8 bagian B (tes watchlist + katalog)
  - Selesai: tests/watchlist.test.mjs (~93 tes: auth, POST, GET, PUT, PATCH, DELETE, kepemilikan, katalog dibagi) dan tests/catalog.test.mjs (~51 tes: validasi query, bentuk respons, pemetaan 10 filter, cache, error 429/502/504, detail). AniList di-mock lewat vi.stubGlobal("fetch") per tes. Temuan it.fails: tidak ada. pnpm test hijau (Windows).
  - File diubah: backend/src/services/anilist.service.mjs (hanya menambah export clearCacheForTests, perilaku tidak berubah)
  - File baru: backend/tests/watchlist.test.mjs, backend/tests/catalog.test.mjs
  - Keputusan baru: cache AniList direset tiap tes lewat clearCacheForTests (khusus tes). Tes watchlist memakai teps = total katalog agar tidak bergantung pada perilaku PUT yang belum terdokumentasi.
  - Perilaku teramati, tidak dijadikan assertion: lihat daftar di catatan (isAdult pencarian, hasNextPage halaman 10, status non-429 diteruskan, GraphQL errors 200 jadi 502, PATCH di episode = total, isi data DELETE).
  - Berikutnya: #11 backend cleanup kecil (isAdult pencarian, strictOptions ke file bersama, JWT_SECRET lewat env.mjs, tes koneksi MySQL), lalu #3 cookie HttpOnly.
- **2026-11-10** — Backend cleanup kecil, bagian A (konfigurasi dan startup)
  - Selesai: env.mjs memusatkan MYSQL*\*, JWT*\*, PORT, NODE_ENV dan melempar error jelas jika JWT_SECRET kosong atau < 16 karakter (nilai tidak dicetak). Middleware auth, auth.service, dan db.mjs memakai env.mjs. index.mjs menguji koneksi MySQL sebelum listen dengan pesan jelas untuk ECONNREFUSED, ER_ACCESS_DENIED_ERROR, ER_BAD_DB_ERROR, lalu exit 1. db.mjs tidak lagi melakukan tes koneksi. backend/.env.example dibuat. Import User tak terpakai dihapus. tests/support/env.mjs ikut memeriksa panjang JWT_SECRET.
  - File diubah: backend/src/config/env.mjs, backend/src/config/db.mjs, backend/index.mjs, backend/src/middlewares/auth.middleware.mjs, backend/src/services/auth.service.mjs, backend/src/controllers/auth.controller.mjs, backend/tests/support/env.mjs
  - File baru: backend/.env.example
  - Keputusan baru: process.env hanya dibaca di env.mjs (kecuali migrate.mjs dan tes). index.mjs memakai import() dinamis supaya error konfigurasi tampil bersih dan app.mjs tidak melakukan cek startup. Batas minimal JWT_SECRET (16) ada di dua tempat (env.mjs dan tests/support/env.mjs), jaga tetap sama. Tidak ada perubahan API, API.md tidak diubah.
  - Berikutnya: #11 bagian B (isAdult pencarian, strictOptions ke file bersama, status non-429 AniList jadi 502, selidiki PUT teps vs anime_catalog), lalu #3 cookie HttpOnly (termasuk CORS).
- **2026-11-10** — Backend cleanup kecil, bagian B (katalog dan validator)
  - Selesai: pencarian AniList memakai isAdult: false. Status gagal AniList selain 429 menjadi 502 (404 hanya lolos pada detail). strictOptions dipindah ke validators/common.mjs (bodyStrictOptions dan queryStrictOptions, pesan lama dipertahankan). Laporan PUT teps vs anime_catalog selesai (kode tidak diubah).
  - File diubah: backend/src/services/anilist.service.mjs, backend/src/validators/{auth,anim,anilist}.validator.mjs, backend/tests/catalog.test.mjs (hanya menambah tes), API.md
  - File baru: backend/src/validators/common.mjs
  - Keputusan baru: requestAniList menerima opsi { allowNotFound } (hanya detail). 404 pada pencarian dan daftar top menjadi 502. Menunggu keputusan pemilik proyek soal PUT teps (opsi A/B/C).
  - Berikutnya: putuskan opsi A/B/C untuk PUT teps dan katalog; lalu #3 cookie HttpOnly (termasuk CORS).
- **2026-11-11** — Katalog diisi server dari AniList, C1 (backend)
  - Selesai: POST /anime mengisi anime_catalog dari AniList lewat getAnimeDetail (title english/romaji/native/"Unknown", cover large, episodes ?? 0, format -> type). Penyegaran best effort bila synced_at NULL atau > 7 hari, upsert aman untuk penambahan bersamaan. PUT memakai total dari katalog (eps > total -> 400, completed -> eps = total, total 0 -> eps dari klien). Field lama (title, imgUrl, totalEps, type, teps) opsional dan diabaikan. Migrasi 003 menambah synced_at. Tes watchlist disesuaikan dan ditambah, helper stub AniList dibuat.
  - File diubah: backend/src/models/anim.model.mjs, backend/src/validators/anim.validator.mjs, backend/tests/watchlist.test.mjs, API.md
  - File baru: backend/src/services/catalog.service.mjs, backend/src/db/migrations/003_add_synced_at_to_anime_catalog.sql, backend/tests/support/anilist.mjs
  - Keputusan baru: gambar katalog memakai coverImage.large (frontend lama mengirim extraLarge), baris lama berganti ke large saat disegarkan. externalId maks 2147483647. Panggilan AniList dilakukan di luar transaksi DB. createWatchList tidak lagi memakai transaksi (hanya satu INSERT).
  - Batasan: katalog hanya disegarkan saat ada yang menambahkan anime itu (tidak ada penyegaran terjadwal, MyList tidak memicu penyegaran). Semua baris lama synced_at NULL, jadi disegarkan pada POST berikutnya. User terautentikasi bisa memicu panggilan AniList lewat externalId sembarang (dibatasi cache 5 menit, rate limiter belum ada).
  - Berikutnya: C2 (frontend berhenti mengirim title, imgUrl, totalEps, type, teps), lalu C3 (hapus field lama dari schema dan dari tes), lalu #3 cookie HttpOnly.
