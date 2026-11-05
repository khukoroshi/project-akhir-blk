# API.md — AniSphere

> Kontrak API antara frontend dan backend. Satu-satunya sumber kebenaran untuk endpoint.
> Tugas frontend cukup membaca file ini, tidak perlu membaca kode backend (dan sebaliknya).
> **Aturan:** setiap menambah atau mengubah endpoint, perbarui file ini di tugas yang sama.
> Terakhir diperbarui: 2026-11-05.

## 1. Konvensi Umum

- **Base URL:** dari `VITE_API_URL` di frontend (contoh lokal: `http://localhost:3000/api`)
- **Format body:** JSON (`Content-Type: application/json`)
- **Auth saat ini:** header `Authorization: Bearer <token>` (JWT, kedaluwarsa default 7 hari)
- **Auth target (PRD):** cookie HttpOnly. Saat migrasi, bagian Auth di file ini wajib diperbarui.
- **Validasi saat ini:** Zod (strict) di endpoint auth dan watchlist. Target: semua endpoint baru wajib Zod.

**Response sukses**

```json
{ "status": "success", "message": "opsional", "data": {} }
```

Endpoint daftar menambah `"results": <jumlah>`.

**Response error**

```json
{ "status": "error", "message": "pesan error" }
```

Saat `NODE_ENV=development`, response error juga memuat `stack`.

**Kode status yang dipakai:** 200, 201, 400, 401, 404, 409, 429, 500, 502, 504.

---

## 2. Endpoint yang Sudah Ada

### Auth

#### `POST /auth/register`

- **Auth:** tidak
- **Body** (strict, field lain ditolak):

| Field      | Tipe   | Wajib | Aturan Zod                                |
| ---------- | ------ | ----- | ----------------------------------------- |
| `name`     | string | ya    | trim, 3-50 karakter                       |
| `email`    | string | ya    | trim, huruf kecil, format email, maks 100 |
| `password` | string | ya    | 8-72 karakter, wajib ada huruf dan angka  |

- **Sukses 201:** `data: { us_id, us_name, us_email }`
- **Error:** 400 validasi gagal (pesan error pertama), 400 "Nama sudah digunakan", 400 "Email sudah digunakan", 400 "Nama atau email sudah digunakan" (kunci tidak dikenali)
- **Catatan:** email disimpan huruf kecil. Nama harus unik di database.

#### `POST /auth/login`

- **Auth:** tidak
- **Body:** `email` (format valid, trim, huruf kecil), `password` (wajib terisi). Field lain ditolak (strict).
- **Sukses 200:** `data: { user: { id, name, email }, token }`
- **Error:** 400 validasi gagal, 401 email atau password salah

#### `GET /auth/profile`

- **Auth:** ya
- **Sukses 200:** `data: { userInfo: { id, name, email, iat, exp } }` (isi payload JWT)
- **Error:** 401 token tidak ada atau tidak valid

### Watchlist (semua endpoint di bawah wajib auth)

> Hanya mengakses data milik user yang sedang login (diambil dari JWT).
> Param `anim_id` wajib bilangan bulat positif (GET /:anim_id, PUT, PATCH, DELETE), kalau tidak 400. Field di luar tabel akan ditolak 400 (strict).
> Bentuk objek `Anime` (terverifikasi lewat alias SELECT dari `user_anime` + `anime_catalog`, sama untuk GET list, GET detail, POST, PUT, PATCH):
> `{ anim_id: number (= user_anime.id), us_id: number, external_id: number, external_source: "anilist", anim_title: string, anim_img_url: string|null, anim_current_episode: number, anim_total_episode: number, anim_type: "TV"|"Movie"|"OVA"|"ONA"|"Special"|"TV Short"|"Music", anim_status: "watching"|"completed"|"dropped"|"plan to watch", anim_tier: "S"|"A"|"B"|"C"|"D"|null, anim_score: number|null (boleh desimal, mis. 8.5), anim_personal_notes: string|null, anim_created_at: string (ISO 8601) }`
> Bentuk ini tidak boleh berubah.

#### `GET /anime`

- **Sukses 200:** `results`, `data: [Anime]`

#### `GET /anime/:anim_id`

- **Sukses 200:** `data: Anime`
- **Error:** 400 `anim_id` tidak valid, 404 tidak ditemukan di watchlist

#### `POST /anime`

- **Body:**

| Field            | Tipe                                                  | Wajib | Aturan Zod / Default                                                                                           |
| ---------------- | ----------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------- |
| `externalId`     | number                                                | ya    | bilangan bulat positif                                                                                         |
| `title`          | string                                                | ya    | trim, 1-255 karakter                                                                                           |
| `externalSource` | string                                                | tidak | hanya `"anilist"`, default `"anilist"`                                                                         |
| `imgUrl`         | string                                                | tidak | URL http/https maks 500, atau null                                                                             |
| `totalEps`       | number                                                | tidak | bilangan bulat >= 0, default 0                                                                                 |
| `type`           | `TV` `Movie` `OVA` `ONA` `Special` `TV Short` `Music` | tidak | tidak peka huruf besar/kecil, garis bawah dianggap spasi (MOVIE -> Movie, TV_SHORT -> TV Short), default `TV`. |
| `status`         | `watching` `completed` `dropped` `plan to watch`      | tidak | default `watching`                                                                                             |
| `tier`           | `S` `A` `B` `C` `D`                                   | tidak | `S`-`D` atau null                                                                                              |
| `score`          | number                                                | tidak | angka 1-10, maksimal 1 desimal (8 atau 8.5), atau null                                                         |
| `notes`          | string                                                | tidak | maks 2000 karakter atau null                                                                                   |

- **Sukses 201:** `data: Anime`
- **Error:** 400 validasi gagal (pesan error pertama), 409 anime sudah ada di watchlist

#### `PUT /anime/:anim_id`

- **Body:** `{ eps, teps, status, tier, score, notes }`
  - `eps` dan `teps`: wajib bilangan bulat >= 0.
  - `status`: wajib (`watching`, `completed`, `dropped`, `plan to watch`).
  - `tier`, `score`, `notes`: opsional/default null (tier: S-D/null, score: 1-10, maks 1 desimal/null, notes: maks 2000/null).
- **Aturan:** jika `teps` > 0 maka `eps` <= `teps`. Jika `status` = `completed` dan `teps` > 0, `eps` otomatis diisi `teps`. Jika `teps` = 0 (total tidak diketahui), `eps` memakai nilai yang dikirim.
- **Sukses 200:** `data: Anime`
- **Error:** 400 validasi gagal, 404 tidak ditemukan
- **Catatan:** Semua field tetap dikirim sekaligus (bukan partial update). `tier`/`score`/`notes` yang tidak dikirim menjadi null.

#### `PATCH /anime/:anim_id/increment`

- **Body:** tidak ada
- **Sukses 200:** `data: Anime` (episode +1)
- **Error:** 400 anim_id tidak valid, 404 tidak ditemukan

#### `DELETE /anime/:anim_id`

- **Sukses 200:** `message` saja
- **Error:** 400 `anim_id` tidak valid, 404 tidak ditemukan di watchlist

### Katalog AniList (publik, tanpa auth)

#### `GET /catalog/anime?q=<kata kunci>`

- **Query:** `q` (opsional). Jika kosong, mengembalikan top 50 berdasarkan skor.
- **Sukses 200:** `data: [ { id, title: { romaji, english, native }, episodes, format, status, averageScore, coverImage: { large } } ]`
- **Catatan:** pencarian maksimal 20 hasil. Hasil di-cache di server selama 5 menit (kata kunci tidak peka huruf besar/kecil). Timeout ke AniList 10 detik.
- **Error:** 429 AniList membatasi request (pesan memuat waktu tunggu), 502 AniList tidak bisa dihubungi, 504 AniList timeout

#### `GET /catalog/anime/:id`

- **Param:** `id` = ID AniList
- **Sukses 200:** `data: Media` (detail lengkap dari AniList)
- **Catatan:** deskripsi bisa berisi HTML, wajib disanitasi di frontend. Detail di-cache 5 menit. Timeout 10 detik.
- **Error:** 400 ID bukan angka positif, 404 anime tidak ditemukan, 429 / 502 / 504 sama seperti pencarian

---

## 3. Endpoint Rencana (dari PRD, belum ada)

| Method | Path (PRD)            | Fase | Catatan                         |
| ------ | --------------------- | ---- | ------------------------------- |
| POST   | `/auth/logout`        | 1    | hapus cookie                    |
| GET    | `/auth/me`            | 1    | pengganti `/auth/profile`?      |
| GET    | `/users/:username`    | 2    | profil publik + statistik       |
| PUT    | `/users/profile`      | 2    | ubah bio, nama tampilan, avatar |
| POST   | `/users/:id/follow`   | 2    | toggle follow                   |
| GET    | `/posts?page=&limit=` | 3    | feed berpaginasi                |
| POST   | `/posts`              | 3    | buat post                       |
| POST   | `/posts/:id/like`     | 3    | toggle like                     |
| GET    | `/posts/:id/comments` | 3    | thread komentar                 |
| POST   | `/posts/:id/comments` | 3    | komentar atau balasan           |
| GET    | `/anime/:id/reviews`  | 4    | review per anime                |
| POST   | `/reviews`            | 4    | tulis atau ubah review          |

**Keputusan yang belum diambil:** path watchlist di kode (`/anime`, `/catalog/anime`) berbeda dari PRD (`/watchlist`, `/anime/search`). Pilih satu, lalu samakan kode dan PRD.

---

## 4. Template Endpoint Baru (salin saat menambah)

```
#### `METHOD /path/:param`
- **Auth:** ya / tidak (role jika perlu)
- **Param / Query:** nama, tipe, keterangan
- **Body:**

| Field | Tipe | Wajib | Aturan Zod / default |
| ----- | ---- | ----- | -------------------- |
| ...   | ...  | ...   | ...                  |

- **Sukses [kode]:** `data: { ... }`
- **Error:** [kode] kondisi
- **Catatan:** efek samping, batas, hal yang perlu diketahui frontend
```

## 5. Log Perubahan

- 2026-11-01: File dibuat, diisi dari kode saat ini.
- 2026-11-02: Katalog AniList: tambah cache 5 menit, timeout 10 detik, error 400/429/502/504.
- 2026-11-03: Auth: validasi Zod (strict) pada register dan login.
- 2026-11-04: Watchlist: validasi Zod (strict) pada param anim_id, POST, PUT. type tidak peka huruf besar/kecil.
- 2026-11-05: Register: nama duplikat kini 400 "Nama sudah digunakan" (dulu 500). PUT: completed dengan teps 0 mempertahankan eps. PATCH increment: tidak lagi 500 untuk anime completed dengan total 0.
- 2026-11-05: Watchlist beralih ke tabel anime_catalog + user_anime (bentuk response tidak berubah). type menerima TV Short dan Music (TV_SHORT dinormalisasi). score boleh desimal (1-10, maks 1 desimal). PUT pada ID tidak ada kini selalu 404.
