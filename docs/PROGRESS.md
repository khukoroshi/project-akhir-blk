# PROGRESS.md — AniSphere

> Baca file ini di awal setiap chat. Perbarui setiap selesai satu tugas.
> Snapshot awal dibuat 2026-11-01 dari `project-akhir-blk-main.zip` (kode per 2026-09-21).
> Target lengkap ada di PRD (`product_requirement_document_prd.md`). File ini hanya mencatat KONDISI SAAT INI.

## 1. Posisi Saat Ini

- **Phase aktif:** Phase 0 (perbaikan fondasi), sebagian selesai (#1, #2, #4, #5, #7, hapus Jikan).
- **Sedang dikerjakan:** -
- **Berikutnya:** Phase 0 #6 (migrasi SQL, Chat A dan B)

## 2. Stack Aktual (sesuai repo)

- **Frontend:** React 19, Vite 8, Tailwind CSS 4 (`@tailwindcss/vite`), React Router 7, Axios, React Compiler. Package manager: pnpm.
- **Backend:** Node.js (ESM, file `.mjs`), Express 5, MySQL (`mysql2`), JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`, `axios`. Dev: `nodemon`.
- **Belum terpasang:** Vitest/Supertest, rate limiter, cookie-parser.
- **API anime eksternal:** AniList (GraphQL) saja. Jikan dibuang.

## 3. Keputusan Final

- AniList adalah satu-satunya API anime publik. Jangan menambah atau memakai Jikan.
- Arsitektur target: modular monolith (`backend/src/modules/<fitur>/`) dan frontend per fitur (`frontend/src/features/<fitur>/`).
- Validasi input dengan Zod. HTML dari API eksternal wajib disanitasi.
- Strategi: refactor bertahap, jangan tulis ulang dari nol.
- Format anime AniList (TV_SHORT, MUSIC) ditampung di database lewat migrasi #6 sebagai 'TV Short' dan 'Music'. Frontend tidak memakai pemetaan format.

## 4. Struktur Saat Ini (belum sesuai target)

**Backend** (berlapis per jenis file, BUKAN modular):
`src/{config, controllers, db, middlewares, models, routes, services, utils, validators}`

- Fitur yang ada: `auth`, `anim` (watchlist), `anilist` (katalog), `user` (service/model saja, tanpa route).
- `backend/public/` berisi frontend statis lama (HTML/JS/CSS), kemungkinan sudah tidak dipakai.
- `backend/api_test/` berisi koleksi uji endpoint (format YAML).

**Frontend:**
`src/{components/common, components/features/{anime,aunt,user}, context, layouts, pages, services, utils}`

- Halaman: `Home`, `MyList` (protected), `AnimeDetail`, `NotFound`. Login dan Register berupa komponen form yang dipakai langsung sebagai route.
- Target `features/` dari PRD belum dibuat. Folder `aunt` kemungkinan typo dari `auth`.

## 5. Endpoint yang Sudah Ada

| Method | Path                            | Auth  | Keterangan                         |
| ------ | ------------------------------- | ----- | ---------------------------------- |
| POST   | `/api/auth/register`            | tidak | daftar                             |
| POST   | `/api/auth/login`               | tidak | token JWT dikirim di body response |
| GET    | `/api/auth/profile`             | ya    | profil dari JWT                    |
| GET    | `/api/anime`                    | ya    | seluruh watchlist user             |
| GET    | `/api/anime/:anim_id`           | ya    | satu item watchlist                |
| POST   | `/api/anime`                    | ya    | tambah ke watchlist                |
| PUT    | `/api/anime/:anim_id`           | ya    | ubah item                          |
| PATCH  | `/api/anime/:anim_id/increment` | ya    | tambah episode                     |
| DELETE | `/api/anime/:anim_id`           | ya    | hapus item                         |
| GET    | `/api/catalog/anime`            | tidak | cari anime (AniList)               |
| GET    | `/api/catalog/anime/:id`        | tidak | detail anime (AniList)             |

Catatan: path PRD (`/api/watchlist`, `/api/anime/search`, `/api/auth/me`) berbeda dari yang ada sekarang. Putuskan nanti apakah diganti atau PRD yang disesuaikan.

## 6. Database Saat Ini

- Database `AniWatchList`, tabel `users` dan `animes` (data katalog dan progres user masih satu tabel).
- Memakai stored procedure (`sp_insert_user`, `sp_insert_anime`, `sp_update_anime`).
- File: `backend/src/db/project_akhir_blk.sql` dan `db-project-test.sql`.
- **Skema PRD (anime_catalog, user_anime, posts, dst.) belum ada.**

## 7. Status Checklist Phase 0

Status hasil pemeriksaan kode, bukan asumsi.

| #   | Item                   | Status       | Temuan                                                                                                                                         |
| --- | ---------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | AuthProvider ganda     | [x] SELESAI  | Tersisa satu di `main.jsx`.                                                                                                                    |
| 2   | URL API hardcode       | [x] SELESAI  | `api.js` memakai `VITE_API_URL`. `.env.example` terisi.                                                                                        |
| 3   | JWT di cookie HttpOnly | [ ] BELUM    | Token di `localStorage` (`api.js`, `AuthProvider.jsx`). Backend membaca header `Authorization: Bearer`.                                        |
| 4   | Validasi Zod           | [x] SELESAI  | Auth dan watchlist (param, POST, PUT) divalidasi strict di `validators/`.                                                                      |
| 5   | Sanitasi HTML          | [x] SELESAI  | DOMPurify, whitelist tag dasar, tanpa atribut.                                                                                                 |
| 6   | Migrasi DB aman        | [~] SEBAGIAN | temuan: “Bagian A selesai: DROP DATABASE dihapus, migrasi 001 membuat anime_catalog dan user_anime. Kode belum memakai tabel baru (bagian B).” |
| 7   | standarkan AniList     | [x] SELESAI  | Timeout 10 detik, cache memori 5 menit, pesan error 429/502/504.                                                                               |
| 8   | Test runner            | [ ] BELUM    | Script `test` di `backend/package.json` masih placeholder.                                                                                     |

## 8. Utang Teknis & Kebersihan

- `JWT_SECRET` dibaca langsung dari `process.env` di middleware, belum lewat `config/env.mjs` dan tidak divalidasi saat startup.
- `cors()` terbuka untuk semua origin.
- `frontend/penyimpanan.txt` berisi salinan kode lama (scratch), hapus dari repo.
- `frontend/package.json` bernama `react-starter-kit`, ganti jadi `anisphere-frontend`.
- Nama file dan komentar campur Indonesia dan Inggris (`anim`, `aunt`). Rapikan saat refactor modul.
- Tidak ada `.env.example` di backend.
- Server belum mengetes koneksi MySQL saat startup, sehingga database mati baru ketahuan saat ada request.
- Schema register bersifat strict: pastikan form Register frontend tidak mengirim field tambahan (misalnya confirmPassword).
- Format AniList TV_SHORT dan MUSIC ditolak 400 oleh schema (anim_type belum punya nilainya). Rencana: tambah nilai di ENUM lewat migrasi #6.
- strictOptions diduplikasi di dua validator.
- Setelah #6, cek apakah db-project-test.sql masih relevan (tabel animes lama tidak dipakai lagi), dan hapus tabel animes lama lewat tugas tersendiri setelah verifikasi.

## 9. Rencana Berikutnya (urutan disarankan)

1. Hapus 3 file Jikan dan baris comment-nya di `app.mjs`. Cari kata `jikan` di seluruh kode.(selesai)
2. Phase 0 #1 dan #2 (AuthProvider ganda, `VITE_API_URL`). Isi `frontend/.env.example`.(selesai)
3. Phase 0 #5 (DOMPurify) dan #7 (timeout + cache AniList).(selesai)
4. Phase 0 #4 (Zod): auth dan watchlist selesai.(selesai)
5. Perbaikan bug kecil backend (nama ganda register, 2 bug model).(selesai)
6. Phase 0 #6 (migrasi SQL tanpa DROP, pisah anime_catalog dan user_anime, tambah nilai format anime).
7. Phase 0 #3 (cookie HttpOnly) dan #8 (test runner).
8. Refactor backend ke `modules/` per fitur, lalu lanjut Phase 2 PRD.
9. Kapan saja (frontend, chat terpisah): 3 perubahan kecil EditAnimeModal (step, maxLength, teps ?? 0); form Register jangan mengirim confirmPassword.

## 10. Template Serah-Terima (tempel di akhir tiap tugas)

```
### [tanggal] — [nama tugas]
- Selesai: ...
- File diubah: ...
- Keputusan baru: ...
- Berikutnya: ...
```

## 11. Log

- ### 2026-11-01: PROGRESS.md dibuat dari audit repo.
- ### 2026-11-02: File Jikan dihapus (controller, service, routes).
- ### 2026-11-02 — Phase 0 poin 1 dan 2
  - Selesai: AuthProvider ganda dihapus (sisa di main.jsx). baseURL memakai VITE_API_URL. .env.example terisi.
  - File diubah: frontend/src/App.jsx, frontend/src/services/api.js, frontend/.env.example
  - Keputusan baru: wajib membuat frontend/.env lokal dari .env.example.
  - Berikutnya: Phase 0 #5 dan #7.
- ### 2026-11-02 — Phase 0 poin 5 (sanitasi HTML)
  - Selesai: deskripsi anime di AnimeDetail.jsx disanitasi dengan DOMPurify (whitelist tag dasar, tanpa atribut).
  - File diubah: frontend/src/pages/AnimeDetail.jsx, frontend/package.json, pnpm-lock.yaml
  - Keputusan baru: HTML dari API eksternal hanya boleh tag format dasar (br, i, b, em, strong, p, ul, ol, li).
  - Berikutnya: Phase 0 #7 (timeout + cache AniList).
- ### 2026-11-02 — Phase 0 poin 7 (timeout + cache AniList)
  - Selesai: timeout 10 detik, cache in-memory (TTL 5 menit, maks 200 entri), pesan jelas untuk 429/502/504, validasi ID detail. requestAniList disatukan untuk search dan detail.
  - File diubah: backend/src/services/anilist.service.mjs
  - Keputusan baru: cache hanya di memori proses (hilang saat restart, tidak dibagi antar instance). Jika nanti butuh banyak instance, pindah ke Redis.
  - Berikutnya: Phase 0 #4 (Zod, mulai dari auth lalu watchlist).
- ### 2026-11-03 — Phase 0 poin 4 (Zod, cakupan auth)
  - Selesai: middleware validate(schema) reusable; schema register dan login (strict); dipasang di POST /register dan /login. Zod terpasang di backend.
  - File diubah: backend/src/middlewares/validate.middleware.mjs (baru), backend/src/validators/auth.validator.mjs (baru), backend/src/routes/auth.routes.mjs, backend/package.json, pnpm-lock.yaml
  - Keputusan baru: validator ada di backend/src/validators/. Pesan error validasi dalam bahasa Indonesia. Body hasil validasi menggantikan req.body.
  - Berikutnya: Zod untuk watchlist (POST/PUT/PATCH /anime), lalu pastikan form Register frontend tidak mengirim field asing. Update checklist #4 jadi sebagian selesai.
- ### 2026-11-04 — Phase 0 poin 4 (Zod, cakupan watchlist)
  - Selesai: validate(schema, source) mendukung body/params/query (params/query tanpa menimpa). Schema anim_id, POST, PUT. Terpasang di semua route /anime ber-:anim_id plus POST dan PUT. Item #4 SELESAI.
  - File diubah: backend/src/middlewares/validate.middleware.mjs, backend/src/validators/anim.validator.mjs (baru), backend/src/routes/anim.routes.mjs
  - Keputusan baru: type tidak peka huruf besar/kecil (MOVIE -> Movie). PUT tetap full-update, status wajib. strictOptions diduplikasi di dua validator (bisa dipindah ke file bersama saat refactor modul). Cek externalId/title di controller sekarang redundan, belum dihapus.
  - Berikutnya: (1) terapkan 3 perubahan kecil EditAnimeModal (step, maxLength, teps ?? 0) dan putuskan pemetaan TV_SHORT/MUSIC di AnimeDetail; (2) form Register jangan kirim confirmPassword; (3) perbaiki 2 bug model: incrementEpisode tanpa teps dan completed dengan teps 0 mereset eps; (4) Phase 0 #6 migrasi SQL.
  - Terverifikasi: AnimeCard dan EditAnimeModal kompatibel dengan schema strict (tidak ada field asing). AnimeList dan AnimeTable tidak mengirim body sendiri.
- ### 2026-11-05 — Perbaikan bug kecil backend
  - Selesai: register menangani ER_DUP_ENTRY (400 "Nama sudah digunakan" / "Email sudah digunakan"); updateWatchList hanya menyetel eps = teps jika completed DAN teps > 0; incrementEpisode mengirim teps dan tanpa nilai undefined; cek manual externalId/title di controller createWatchList dihapus.
  - File diubah: backend/src/services/auth.service.mjs, backend/src/models/anim.model.mjs, backend/src/controllers/anim.controller.mjs, API.md
  - Keputusan baru: nama kunci unik dibaca dari pesan error MySQL (akhiran us_name / us_email). Jika kunci tidak dikenali, pesan umum "Nama atau email sudah digunakan". Migrasi #6 jangan mengganti nama kedua kunci ini tanpa memperbarui auth.service.
  - Berikutnya: Phase 0 #6 (migrasi SQL tanpa DROP, pisah anime_catalog dan user_anime, tambah nilai TV_SHORT/MUSIC).
- ### 2026-11-05 — Phase 0 #6 bagian A (struktur database)
  - Selesai: project_akhir_blk.sql tanpa DROP DATABASE (hanya instalasi baru); runner migrasi (pnpm migrate) dengan tabel schema_migrations; migrasi 001 membuat anime_catalog dan user_anime lalu menyalin data dari animes. Tabel animes lama tidak diubah.
  - File diubah: backend/src/db/project_akhir_blk.sql, backend/src/db/migrate.mjs (baru), backend/src/db/migrations/001_create_anime_catalog_and_user_anime.sql (baru), backend/package.json
  - Keputusan baru: anime_catalog memakai nama kolom PRD plus anim_type (ENUM TV/Movie/OVA/ONA/Special/TV Short/Music); external_id INT UNSIGNED; status memakai spasi ('plan to watch', 'on hold', 'rewatching'), PRD perlu disesuaikan; score DECIMAL(3,1) CHECK 1-10, tier ENUM S-D; user_anime.id = anim_id lama; user_anime punya created_at; konflik katalog diambil dari anim_id terbesar; baris non-anilist di-skip. File migrasi tidak boleh memakai DELIMITER, harus idempotent, tanpa DROP/TRUNCATE. Urutan instalasi baru: project_akhir_blk.sql lalu pnpm migrate.
  - Berikutnya: bagian B (model/controller membaca user_anime + anime_catalog dengan alias agar bentuk objek Anime tetap; decimalNumbers: true; Zod score desimal; update API.md). Tabel animes lama dihapus lewat tugas terpisah setelah terverifikasi. Ubah PRD: status bergaya spasi, score DECIMAL.
