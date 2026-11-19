# PROGRESS.md — AniSphere

> Baca file ini di awal setiap chat. Perbarui setiap selesai satu tugas.
> Snapshot awal dibuat 2026-11-01 dari `project-akhir-blk-main.zip` (kode per 2026-09-21).
> Target lengkap ada di PRD (`product_requirement_document_prd.md`). File ini hanya mencatat KONDISI SAAT INI.

## 1. Posisi Saat Ini

- **Phase aktif:** Phase 0 dan refactor modules/ (langkah 16, 16A sampai 16D) selesai.
- **Sedang dikerjakan:** -
- **Berikutnya:** Phase 2 (profil dan follow)

## 2. Stack Aktual (sesuai repo)

- **Frontend:** React 19, Vite 8, Tailwind CSS 4 (`@tailwindcss/vite`), React Router 7, Axios, React Compiler. Package manager: pnpm.
- **Backend:** Node.js (ESM, file `.mjs`), Express 5, MySQL (`mysql2`), JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`, `axios`, `cookie-parser`. Dev: `nodemon`, Vitest, Supertest, `express-rate-limit`, Terpasang tambahan: `express-rate-limit`.
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

## 4. Struktur Saat Ini (sesuai target backend)

**Backend** (modular):
`src/{config, db (migrate.mjs, migrations/), integrations/anilist (anilist.client.mjs, index.mjs), middlewares, modules/{anime, watchlist, auth, users} (tiap modul: <nama>.*.mjs dan index.mjs), utils (validation.mjs, authCookies.mjs, ...), app.mjs}`

- Aturan impor (dijaga `tests/architecture.test.mjs`): kode di luar `modules/<b>` hanya boleh mengimpor `modules/<b>/index.mjs`; `integrations/` tidak boleh mengimpor `modules/`.
- Fitur yang ada: `auth`, `watchlist` (modul di modules/watchlist), `anime` (katalog, sudah modul di modules/anime), users (modul di modules/users: service dan model saja, route menyusul di Phase 2).
- `backend/public/` berisi frontend statis lama (HTML/JS/CSS), kemungkinan sudah tidak dipakai.
- `backend/api_test/` berisi koleksi uji endpoint (format YAML).
- Tes backend: `backend/vitest.config.mjs`, `backend/tests/` (base-schema.sql, base-legacy-animes.sql, global-setup.mjs, setup.mjs, support/, {auth,auth-cookie,watchlist,catalog,rateLimit,db,architecture}.test.mjs).
- Folder yang diizinkan di src/: config, db, integrations, middlewares, modules, utils, plus app.mjs (dijaga tests/architecture.test.mjs).

**Frontend:**
`src/{components/common, components/features/{anime,aunt,user}, context, layouts, pages, services, utils}`

- Halaman: `Home`, `MyList` (protected), `AnimeDetail`, `NotFound`. Login dan Register berupa komponen form yang dipakai langsung sebagai route.
- Target `features/` dari PRD belum dibuat. Folder `aunt` kemungkinan typo dari `auth`.
- Frontend katalog: `components/common/{Pagination,DaftarAnime,FilterTabs}.jsx`, `utils/catalogFilters.js` (daftar filter, harus sama dengan validator backend).

## 5. Endpoint yang Sudah Ada

| Method | Path                            | Auth  | Keterangan                                                             |
| ------ | ------------------------------- | ----- | ---------------------------------------------------------------------- |
| POST   | `/api/auth/register`            | tidak | daftar                                                                 |
| POST   | `/api/auth/login`               | tidak | user di body, JWT hanya di cookie                                      |
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

- Database `AniWatchList`. Tabel: `users`, `anime_catalog`, `user_anime`, `schema_migrations`, dan `animes_legacy` (cadangan hasil rename migrasi 004, tidak dipakai kode).
- Stored procedure: hanya `sp_insert_user` (dipakai auth).
- Migrasi: 001 sampai 004 (004_retire_legacy_animes.sql).
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
- modules/watchlist belum punya lapisan service (controller memanggil model langsung); tambahkan saat fitur Phase 2 menyentuh watchlist (mis. statistik profil).
- Nama internal watchlist (Anime, getAllAnime, cariAnimeById) masih campur Indonesia dan Inggris. Jangan mengganti nama field respons `anim_*`, itu kontrak.
- Komentar di watchlist.model.mjs masih menyebut Stored Procedure padahal sudah query biasa. Perbaiki sambil lalu.

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
17. Phase 2 (profil dan follow), empat chat: 2A backend (migrasi 005, GET /users/:username, PUT /users/profile, statistik lewat watchlist.service) (selesai); 2B backend (follow/unfollow, jumlah, isFollowing); 2C frontend (halaman profil, statistik, navbar); 2D frontend (edit profil dan tombol follow).

## 10. Template Serah-Terima (tempel di akhir tiap tugas)

```
- **[tanggal]** — [nama tugas]
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
- **2026-11-11** — C2 (frontend berhenti mengirim field lama)
  - Selesai: handleAddToList hanya mengirim externalId, status, tier, score, notes (externalSource tidak dikirim, default server "anilist"). EditAnimeModal tidak lagi mengirim teps. Pesan error server ditampilkan (404/409/429/502/504 untuk Add to list lewat setAddMessage; 400 melebihi total untuk edit, lewat err.message). console.log/error di handleAddToList dihapus. Pesan sukses Add to list memuat judul anime. AnimeList, AnimeTable, AnimeTableRow, AnimeCard, MyList, DaftarAnime diperiksa: tidak ada yang mengirim field lama.
  - File diubah: frontend/src/pages/AnimeDetail.jsx, frontend/src/components/features/anime/EditAnimeModal.jsx
  - Keputusan baru: total episode di UI tetap dari anim_total_episode (tampilan dan batas max input).
  - Belum diverifikasi: CardImage.jsx dan AnimeSection.jsx; cek akhir lewat tab Network.
  - Berikutnya: C3 (hapus title, imgUrl, totalEps, type, teps dari schema backend dan tes), lalu #3 cookie HttpOnly (termasuk CORS).
- **2026-11-11** — C3 (backend, rapikan kontrak)
  - Selesai: title, imgUrl, totalEps, type dihapus dari schema POST dan teps dari schema PUT; normalisasi type dibuang. Schema tetap strict: field lama ditolak 400 dengan pesan "Field '<nama>' tidak dikenal. Katalog diisi server dari AniList." Komentar deprecated di model dibersihkan. Tes lama yang memakai field lama dihapus atau diubah; tes penolakan (POST, PUT, beberapa field sekaligus) dan POST hanya { externalId } ditambah.
  - File diubah: backend/src/validators/anim.validator.mjs, backend/src/models/anim.model.mjs (komentar saja), backend/tests/watchlist.test.mjs, API.md
  - Keputusan baru: pesan khusus field lama dibuat lokal di anim.validator.mjs (membungkus bodyStrictOptions), common.mjs tidak berubah. Controller tidak perlu diubah.
  - Berikutnya: #3 cookie HttpOnly + CSRF + CORS, lalu rate limiter.
- **2026-11-12** — Phase 0 #3, bagian 13A (backend cookie HttpOnly + CSRF + CORS)
  - Selesai: cookie-parser terpasang. env.mjs memvalidasi CORS_ORIGINS, COOKIE_SECURE, COOKIE_SAMESITE (pesan Indonesia). cors() terbuka diganti daftar origin + credentials. Login mengatur access_token (HttpOnly) dan csrf_token. auth.middleware menerima Bearer ATAU cookie (header Authorization didahulukan). CSRF double-submit (timingSafeEqual) dipanggil dari protect hanya untuk sesi cookie. POST /auth/logout baru. Tes baru auth-cookie.test.mjs; tes lama tetap hijau.
  - File diubah: backend/src/config/env.mjs, backend/.env.example, backend/src/app.mjs, backend/src/middlewares/auth.middleware.mjs, backend/src/controllers/auth.controller.mjs, backend/src/routes/auth.routes.mjs, backend/tests/support/env.mjs, backend/package.json, pnpm-lock.yaml, API.md
  - File baru: backend/src/config/cors.mjs, backend/src/utils/authCookies.mjs, backend/src/middlewares/csrf.middleware.mjs, backend/tests/auth-cookie.test.mjs
  - Keputusan baru: SameSite=Lax dengan deployment frontend dan backend di situs yang sama (localhost:5173 dan localhost:3000 sama-situs; di produksi keduanya harus satu domain induk, kalau tidak pakai none + Secure). CSRF dicek di dalam protect (bukan di route), jadi route baru otomatis terlindungi dan register/login/logout bebas CSRF. Max-Age cookie dihitung dari exp-iat JWT. Logout tanpa schema Zod karena tidak punya input. Tes mutasi ber-cookie membuktikan lolos guard (bukan 401/403), bukan jalur sukses penuh watchlist. .env.test dan .env.test.example wajib memuat CORS_ORIGINS, COOKIE_SECURE=false, COOKIE_SAMESITE=lax (dicek di tests/support/env.mjs).
  - Wajib dilakukan sendiri: tambahkan tiga variabel baru ke .env, .env.test, dan .env.test.example di tiap perangkat (Windows dan Linux).
  - Berikutnya: 13B frontend (Axios withCredentials, kirim X-CSRF-Token dari cookie csrf_token, hapus token dari localStorage, logout memanggil POST /auth/logout), lalu 13C backend (hapus Bearer dan token di body login), lalu rate limiter.
- **2026-11-13** — Phase 0 #3, bagian 13B (frontend cookie)
  - Selesai: api.js memakai withCredentials, mengirim X-CSRF-Token dari cookie csrf_token untuk POST/PUT/PATCH/DELETE, tanpa Authorization dan tanpa localStorage token. Interceptor 401 memanggil handler dari AuthProvider (tanpa window.location). AuthProvider mengecek GET /auth/profile hanya jika cookie csrf_token ada, menghapus key "token" lama, login(user) tanpa token, logout memanggil POST /auth/logout. .env.example diberi komentar localhost.
  - File diubah: frontend/src/services/api.js, frontend/src/context/AuthProvider.jsx, frontend/src/components/features/aunt/LoginForm.jsx, frontend/.env.example
  - Keputusan baru: cek sesi awal memakai opsi skipUnauthorizedHandler (401 normal, tanpa console.error); 401 saat cek sesi memanggil POST /auth/logout untuk membersihkan cookie sisa. Context menyediakan user, isAuthenticated, loading, login, logout.
  - Berikutnya: 13C backend (hapus Bearer dan token di body login; perbarui API.md), lalu rate limiter.
  - Diverifikasi: grep localStorage/sessionStorage/Authorization di frontend/src bersih. Sisa localStorage hanya key "theme" (ThemeProvider) dan penghapusan key "token" lama (AuthProvider).
- **2026-11-13** — Phase 0 #3, bagian 13C (backend hapus Bearer)
  - Selesai: auth.middleware hanya membaca cookie access_token (header Authorization diabaikan). CSRF dicek untuk semua mutasi terautentikasi (pengecualian Bearer dihapus). Authorization dihapus dari CORS allowedHeaders. Login hanya mengembalikan { user }. Helper tes withSession menjadi satu-satunya tempat logika cookie + X-CSRF-Token. Item #3 SELESAI, Phase 0 selesai.
  - File diubah: backend/src/middlewares/auth.middleware.mjs, backend/src/middlewares/csrf.middleware.mjs (komentar), backend/src/config/cors.mjs, backend/src/controllers/auth.controller.mjs, backend/tests/support/helpers.mjs, backend/tests/{auth,auth-cookie,watchlist}.test.mjs, API.md
  - Keputusan baru: pesan 401 "belum login" tidak lagi menyebut token. Token tes = nilai cookie access_token; helper menyimpan pasangan csrf di Map. Logout tetap tanpa revokasi (utang teknis).
  - Wajib dilakukan sendiri: di produksi set COOKIE_SECURE=true (dan frontend/backend satu domain induk). Perbarui koleksi backend/api_test (Bruno) ke cookie bila masih memakai Bearer.
  - Berikutnya: rate limiter (login, katalog, POST /anime), lalu hapus tabel animes lama dan 2 procedure, lalu refactor ke modules/.
- **2026-11-14** — Rate limiter
  - Selesai: express-rate-limit terpasang. Pembatas: global /api, login (per IP+email dan per IP, hanya gagal dihitung, dipasang sebelum validasi dan bcrypt), register, katalog, POST /anime (per user). Respons 429 lewat AppError (bahasa Indonesia, menyebut menit) + Retry-After; standardHeaders aktif, legacyHeaders mati. env: RATE*LIMIT_ENABLED, TRUST_PROXY (angka 1-10, "true" ditolak), RATE_LIMIT*<NAMA>\_MAX/\_WINDOW_MIN. Tes: rateLimit.test.mjs; pembatas mati di semua tes lain.
  - File diubah: backend/src/app.mjs (jadi createApp(), default export tetap), backend/src/routes/anim.routes.mjs (createAnimRoutes), backend/src/config/env.mjs, backend/.env.example, backend/tests/support/env.mjs, backend/package.json, pnpm-lock.yaml, API.md
  - File baru: backend/src/config/rateLimit.mjs, backend/tests/rateLimit.test.mjs
  - Keputusan baru: state pembatas di memori proses (hilang saat restart, tidak dibagi antar instance; pindah ke store Redis jika multi-instance). Kunci per-user memakai req.user.id (verifikasi cocok dengan auth.middleware). Produksi di belakang proxy wajib isi TRUST_PROXY sesuai jumlah proxy, kalau tidak semua pengguna tampak satu IP. JSON rusak ditolak sebelum pembatas login (tetap kena batas global).
  - Wajib dilakukan sendiri: pada Windows dan Linux jalankan pnpm install. TRUST_PROXY di server produksi.
  - Berikutnya: langkah 14 diganti: hapus tabel animes lama dan 2 stored procedure (langkah 15 lama), lalu refactor ke modules/.
- **2026-11-16** — Langkah 15: pensiunkan tabel animes lama dan 2 procedure
  - Selesai: migrasi 004 me-rename animes -> animes_legacy (kondisional) dan drop sp_insert_anime, sp_update_anime. project_akhir_blk.sql: 2 procedure dihapus, tabel animes diberi komentar legacy. Tes db.test.mjs baru. Fallback new_us_id di auth.service.mjs dihapus (terverifikasi: sp_insert_user mengembalikan us_id).
  - File diubah: backend/src/db/project_akhir_blk.sql, backend/tests/support/db.mjs, backend/tests/base-schema.sql, backend/tests/global-setup.mjs , backend/src/services/auth.service.mjs
  - File baru: backend/src/db/migrations/004_retire_legacy_animes.sql, backend/tests/base-legacy-animes.sql, backend/tests/db.test.mjs
  - Keputusan baru: animes_legacy dipertahankan sebagai cadangan. DROP MANUAL animes_legacy setelah 30 hari (tanggal: 2026-12-16), setelah backup, di luar runner migrasi, lalu catat di PROGRESS.md. Definisi animes di tes dipisah ke base-legacy-animes.sql dan hanya dijalankan jika animes_legacy belum ada (menghindari bentrok nama FK fk_anime_user). Aturan PRD 7 perlu diperjelas: DROP PROCEDURE boleh di migrasi, DROP TABLE tidak.
  - Utang teknis: hapus base-legacy-animes.sql saat animes_legacy di-drop, dan rapikan project_akhir_blk.sql beserta migrasi 001/002 jika sudah tidak dibutuhkan. Perbarui bagian 6 (Database Saat Ini): animes -> animes_legacy, procedure tinggal sp_insert_user.
  - Berikutnya: langkah 16 (refactor ke modules/), lalu Phase 2.
- **2026-11-16** — Langkah 16A: refactor ke modules/, tahap 1 (katalog)
  - Selesai: integrasi AniList dan modul katalog dipindah (git mv) dan semua import diperbaiki. Dibuat integrations/anilist/index.mjs (getAnime, getAnimeDetail, clearCacheForTests) dan modules/anime/index.mjs (catalogRoutes, ensureCatalogEntry). app.mjs memasang catalogRoutes di /api/catalog. Tes arsitektur baru. Tidak ada perubahan perilaku API.
  - File diubah: src/app.mjs, src/models/anim.model.mjs, src/validators/{auth,anim}.validator.mjs, file yang dipindah (hanya import), tests/catalog.test.mjs, tests/support/anilist.mjs
  - File baru: src/integrations/anilist/index.mjs, src/modules/anime/index.mjs, tests/architecture.test.mjs
  - Keputusan baru: modul diekspor sebagai instance router (bukan pabrik), sesuai gaya app.mjs. Satu-satunya penggantian nama: anilistRoutes -> catalogRoutes. Tes boleh mengimpor dari integrations/anilist/index.mjs.
  - Berikutnya: 16B (modul watchlist: anim.model/controller/routes/validator ke modules/watchlist, impor katalog tetap lewat modules/anime/index.mjs). Pengingat: DROP manual animes_legacy pada atau setelah 2026-12-16, setelah backup.
- **2026-11-16** — Langkah 16B: refactor ke modules/, tahap 2 (watchlist)
  - Selesai: controller, model, routes, validator watchlist dipindah ke modules/watchlist/ (git mv) dan semua import diperbaiki. Dibuat modules/watchlist/index.mjs yang hanya mengekspor createWatchlistRoutes. app.mjs memasang router di /api/anime dengan urutan middleware, pembatas laju, dan CSRF yang sama. Watchlist mengimpor katalog hanya lewat modules/anime/index.mjs. Tidak ada perubahan perilaku API, API.md tidak diubah.
  - File diubah: src/app.mjs, src/modules/watchlist/{watchlist.controller, watchlist.model,watchlist.routes,watchlist.validator}.mjs (hanya import dan satu nama ekspor)
  - File baru: src/modules/watchlist/index.mjs
  - Keputusan baru: modul watchlist mengekspor pabrik (bukan instance router) karena pembatas laju per user disuntikkan dari app.mjs. Satu-satunya penggantian nama: createAnimRoutes -> createWatchlistRoutes.
  - Utang teknis: modules/watchlist belum punya lapisan service (controller masih memanggil model langsung). Nama internal (Anime, getAllAnime, cariAnimeById) masih campur Indonesia/Inggris. Komentar di model masih menyebut Stored Procedure padahal sudah query biasa.
  - Berikutnya: 16C (modul auth dan users), lalu 16D (hapus folder lama dan tambah aturan tes arsitektur). Pengingat: DROP manual animes_legacy pada atau setelah 2026-12-16, setelah backup.
- **2026-11-17** — Langkah 16C: refactor ke modules/, tahap 3 (auth dan users)
  - Selesai: auth (controller, service, routes, validator) dan users (service, model) ada di modules/. Dibuat modules/auth/index.mjs (ekspor authRoutes, instance router) dan modules/users/index.mjs (isEmailTaken, findUserByEmail, createUser). Query users dipindah dari auth.service ke users.model; auth hanya mengakses users lewat index.mjs. app.mjs memasang authRoutes di /api/auth, urutan middleware tidak berubah. Tidak ada perubahan perilaku API, API.md tidak diubah.
  - File diubah: src/app.mjs, src/modules/auth/{auth.controller,auth.service,auth.routes,auth.validator}.mjs (import dan pemanggilan users)
  - File baru/diisi ulang: src/modules/auth/index.mjs, src/modules/users/{index,users.service,users.model}.mjs
  - Keputusan baru: pesan error (AppError) dan penanganan ER_DUP_ENTRY tetap di auth.service; users.model melempar error mentah. auth.middleware dan utils/authCookies tetap di luar modules.
  - Utang teknis: modules/users belum punya controller/routes (Phase 2). Auth belum punya model sendiri (tidak perlu saat ini). User.getProfile lama dihapus (kode mati).
  - Berikutnya: 16D (hapus folder lama yang kosong, tambah aturan tes arsitektur). Pengingat: DROP manual animes_legacy pada atau setelah 2026-12-16, setelah backup.
- **2026-11-18** — Langkah 16D: kunci struktur modular di tes arsitektur (langkah 16 selesai)
  - Selesai: tests/architecture.test.mjs ditambah aturan (c) hanya folder config, db, integrations, middlewares, modules, utils (dan file app.mjs) di bawah src/; (d) tiap folder modules/<nama> wajib punya index.mjs; (e) tidak ada import statis/dinamis ke folder terlarang. Pemeriksa struktur berupa fungsi murni (checkTopLevel, checkModuleIndexes) yang punya tes sendiri. Tanpa database dan internet. Tidak ada file yang melanggar. Tidak ada perubahan kode aplikasi atau API.
  - File diubah: backend/tests/architecture.test.mjs
  - Keputusan baru: file lepas selain app.mjs di src/ juga dilarang. Folder lama (controllers, models, routes, services, validators) dilarang permanen; kode baru wajib di modules/<nama>/.
  - Berikutnya: Phase 2 (profil dan follow) di modules/users (tambah controller, routes, validator; ekspor lewat index.mjs). Pengingat: DROP manual animes_legacy pada atau setelah 2026-12-16, setelah backup.
- **2026-11-19** — Phase 2, bagian 2A (backend: profil)
  - Selesai: migrasi 005 (user_profiles, follows). optionalAuth. watchlist.service.getUserStats (lapisan service pertama watchlist). modules/users punya controller, routes (createUsersRoutes), validator, dan model profil. GET /users/:username (stats null untuk profil privat bukan pemilik), PUT /users/profile (upsert, pembatas profileUpdate 30/15 mnt per user). Register memakai regex username baru. Tes users.test.mjs dan tes username di auth.test.mjs.
  - File diubah: src/app.mjs, src/middlewares/auth.middleware.mjs, src/config/rateLimit.mjs, src/config/env.mjs, backend/.env.example (opsional), src/modules/auth/auth.validator.mjs, src/modules/watchlist/{watchlist.model,index}.mjs, src/modules/users/{index,users.model,users.service}.mjs, tests/support/db.mjs, tests/support/db.mjs, tests/auth.test.mjs, tests/rateLimit.test.mjs, tests/auth-cookie.test.mjs (hapus deklarasi ganda findCookie/cookieValue), API.md
  - File baru: src/db/migrations/005_create_user_profiles_and_follows.sql, src/modules/watchlist/watchlist.service.mjs, src/modules/users/{users.controller,users.routes,users.validator}.mjs, tests/users.test.mjs (tes pembatas laju PUT ada di rateLimit.test.mjs)
  - Keputusan baru: username = us_name; respons profil camelCase tanpa email/hash/us_id. Profil privat: stats null untuk orang lain. Baris user_profiles dibuat saat PUT pertama; GET memakai default. avatar/banner ditolak (strict) sampai Phase 3. optionalAuth hanya untuk GET. Nama baru wajib regex; pengguna lama tetap bisa login (query awal: 0 baris tidak cocok). `total` statistik menghitung semua baris user_anime, byStatus hanya 4 status API.
  - Wajib dilakukan sendiri: pnpm migrate di Windows dan Linux (backup dulu). Variabel RATE*LIMIT_PROFILE_UPDATE*\* bersifat opsional (ada default 30 per 15 menit).
  - Berikutnya: 2B (follow/unfollow, jumlah follower/following, isFollowing di GET profil; endpoint /users/:username/follow sesuai PRD).
  - Bagian 4 (Struktur): modules/users kini lengkap (<nama>.{controller,service,model,routes,validator}.mjs + index.mjs); modules/watchlist punya watchlist.service.mjs. Tes baru: users.test.mjs.
  - Bagian 5 (Endpoint): tambahkan GET /api/users/:username (auth opsional) dan PUT /api/users/profile (ya).
  - Bagian 6 (Database): tabel tambahan `user_profiles` dan `follows` (migrasi 005; follows belum dipakai sampai 2B). Migrasi: 001 sampai 005.
  - Bagian 8 (Utang teknis): hapus butir "modules/watchlist belum punya lapisan service" (diganti: controller watchlist masih memanggil model langsung, service baru hanya untuk statistik). Tambah: bio dan displayName disimpan apa adanya, frontend wajib merender sebagai teks. Tambah: regex username hanya untuk pendaftar baru; username lama berspasi diakses ter-encode.
