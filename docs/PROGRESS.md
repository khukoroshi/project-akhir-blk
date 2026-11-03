# PROGRESS.md — AniSphere

> Baca file ini di awal setiap chat. Perbarui setiap selesai satu tugas.
> Snapshot awal dibuat 2026-11-01 dari `project-akhir-blk-main.zip` (kode per 2026-09-21).
> Target lengkap ada di PRD (`product_requirement_document_prd.md`). File ini hanya mencatat KONDISI SAAT INI.

## 1. Posisi Saat Ini

- **Phase aktif:** Phase 0 (perbaikan fondasi), belum ada yang selesai.
- **Sedang dikerjakan:** -
- **Berikutnya:** hapus Jikan, lalu Phase 0 poin 1 (AuthProvider ganda).

## 2. Stack Aktual (sesuai repo)

- **Frontend:** React 19, Vite 8, Tailwind CSS 4 (`@tailwindcss/vite`), React Router 7, Axios, React Compiler. Package manager: pnpm.
- **Backend:** Node.js (ESM, file `.mjs`), Express 5, MySQL (`mysql2`), JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`, `axios`. Dev: `nodemon`.
- **Belum terpasang:** Zod, DOMPurify, Vitest/Supertest, rate limiter, cookie-parser.
- **API anime eksternal:** AniList (GraphQL) saja. Jikan dibuang.

## 3. Keputusan Final

- AniList adalah satu-satunya API anime publik. Jangan menambah atau memakai Jikan.
- Arsitektur target: modular monolith (`backend/src/modules/<fitur>/`) dan frontend per fitur (`frontend/src/features/<fitur>/`).
- Validasi input dengan Zod. HTML dari API eksternal wajib disanitasi.
- Strategi: refactor bertahap, jangan tulis ulang dari nol.

## 4. Struktur Saat Ini (belum sesuai target)

**Backend** (berlapis per jenis file, BUKAN modular):
`src/{config, controllers, db, middlewares, models, routes, services, utils}`

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

| #   | Item                            | Status                | Temuan                                                                                                  |
| --- | ------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | AuthProvider ganda              | [ ] BELUM             | Ada di `main.jsx` DAN `App.jsx`. Hapus yang di `App.jsx`.                                               |
| 2   | URL API hardcode                | [ ] BELUM             | `services/api.js` memakai `http://localhost:3000/api`. `frontend/.env.example` kosong.                  |
| 3   | JWT di cookie HttpOnly          | [ ] BELUM             | Token di `localStorage` (`api.js`, `AuthProvider.jsx`). Backend membaca header `Authorization: Bearer`. |
| 4   | Validasi Zod                    | [ ] BELUM             | Zod belum terpasang, controller langsung memakai `req.body`.                                            |
| 5   | Sanitasi HTML                   | [ ] BELUM             | `AnimeDetail.jsx` baris ~289 memakai `dangerouslySetInnerHTML`, DOMPurify belum ada.                    |
| 6   | Migrasi DB aman                 | [ ] BELUM             | `project_akhir_blk.sql` diawali `DROP DATABASE AniWatchList;`.                                          |
| 7   | Hapus Jikan, standarkan AniList | [~] Sedang dikerjakan | Service AniList belum punya timeout dan cache.                                                          |
| 8   | Test runner                     | [ ] BELUM             | Script `test` di `backend/package.json` masih placeholder.                                              |

## 8. Utang Teknis & Kebersihan

- `JWT_SECRET` dibaca langsung dari `process.env` di middleware, belum lewat `config/env.mjs` dan tidak divalidasi saat startup.
- `cors()` terbuka untuk semua origin.
- `frontend/penyimpanan.txt` berisi salinan kode lama (scratch), hapus dari repo.
- `frontend/package.json` bernama `react-starter-kit`, ganti jadi `anisphere-frontend`.
- Nama file dan komentar campur Indonesia dan Inggris (`anim`, `aunt`). Rapikan saat refactor modul.
- Tidak ada `.env.example` di backend.

## 9. Rencana Berikutnya (urutan disarankan)

1. Hapus 3 file Jikan dan baris comment-nya di `app.mjs`. Cari kata `jikan` di seluruh kode.
2. Phase 0 #1 dan #2 (AuthProvider ganda, `VITE_API_URL`). Isi `frontend/.env.example`.
3. Phase 0 #5 (DOMPurify) dan #7 (timeout + cache AniList).
4. Phase 0 #4 (Zod) mulai dari auth, lalu watchlist.
5. Phase 0 #6 (migrasi SQL tanpa DROP) dan pemisahan `anime_catalog` dan `user_anime`.
6. Phase 0 #3 (cookie HttpOnly) dan #8 (test runner).
7. Refactor backend ke `modules/` per fitur (auth, anime, watchlist), lalu lanjut Phase 2 PRD.

## 10. Template Serah-Terima (tempel di akhir tiap tugas)

```
### [tanggal] — [nama tugas]
- Selesai: ...
- File diubah: ...
- Keputusan baru: ...
- Berikutnya: ...
```

## 11. Log

- 2026-11-01: PROGRESS.md dibuat dari audit repo. Belum ada tugas Phase 0 yang dikerjakan.
