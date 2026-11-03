# API.md — AniSphere

> Kontrak API antara frontend dan backend. Satu-satunya sumber kebenaran untuk endpoint.
> Tugas frontend cukup membaca file ini, tidak perlu membaca kode backend (dan sebaliknya).
> **Aturan:** setiap menambah atau mengubah endpoint, perbarui file ini di tugas yang sama.
> Terakhir diperbarui: 2026-11-01 (diisi dari kode saat ini, bagian "Rencana" dari PRD).

## 1. Konvensi Umum

- **Base URL:** `http://localhost:3000/api` (target: `VITE_API_URL` di frontend)
- **Format body:** JSON (`Content-Type: application/json`)
- **Auth saat ini:** header `Authorization: Bearer <token>` (JWT, kedaluwarsa default 7 hari)
- **Auth target (PRD):** cookie HttpOnly. Saat migrasi, bagian Auth di file ini wajib diperbarui.
- **Validasi saat ini:** belum ada, hanya cek manual di sebagian controller. **Target:** Zod di semua POST/PUT/PATCH.

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

**Kode status yang dipakai:** 200, 201, 400, 401, 404, 409, 500.

---

## 2. Endpoint yang Sudah Ada

### Auth

#### `POST /auth/register`
- **Auth:** tidak
- **Body:** `{ "name": string, "email": string, "password": string }`
- **Sukses 201:** `data: { us_id, us_name, us_email }`
- **Error:** 400 email sudah digunakan
- **Catatan:** belum ada validasi format email atau panjang password. Nama harus unik di database.

#### `POST /auth/login`
- **Auth:** tidak
- **Body:** `{ "email": string, "password": string }`
- **Sukses 200:** `data: { user: { id, name, email }, token }`
- **Error:** 401 email atau password salah

#### `GET /auth/profile`
- **Auth:** ya
- **Sukses 200:** `data: { userInfo: { id, name, email, iat, exp } }` (isi payload JWT)
- **Error:** 401 token tidak ada atau tidak valid

### Watchlist (semua endpoint di bawah wajib auth)

> Hanya mengakses data milik user yang sedang login (diambil dari JWT).
> Bentuk objek anime di response mengikuti kolom tabel `animes` (`anim_id`, `anim_title`, `anim_status`, dst.). **Belum diverifikasi rinci, cek saat mengerjakan tugas frontend.**

#### `GET /anime`
- **Sukses 200:** `results`, `data: [Anime]`

#### `GET /anime/:anim_id`
- **Sukses 200:** `data: Anime`
- **Error:** 404 tidak ditemukan di watchlist

#### `POST /anime`
- **Body:**

| Field | Tipe | Wajib | Default |
|---|---|---|---|
| `externalId` | number | ya | - |
| `title` | string | ya | - |
| `externalSource` | string | tidak | `"anilist"` |
| `imgUrl` | string | tidak | null |
| `totalEps` | number | tidak | 0 |
| `type` | `TV` `Movie` `OVA` `ONA` `Special` | tidak | `TV` |
| `status` | `watching` `completed` `dropped` `plan to watch` | tidak | `watching` |
| `tier` | `S` `A` `B` `C` `D` | tidak | null |
| `score` | number 1-10 | tidak | null |
| `notes` | string | tidak | null |

- **Sukses 201:** `data: Anime`
- **Error:** 400 `externalId` atau `title` kosong, 409 anime sudah ada di watchlist

#### `PUT /anime/:anim_id`
- **Body:** `{ eps, teps, status, tier, score, notes }` (`eps` = episode ditonton, `teps` = total episode)
- **Perilaku:** jika `status` = `completed`, `eps` otomatis diisi dengan `teps`
- **Sukses 200:** `data: Anime`
- **Error:** 404 tidak ditemukan
- **Catatan:** semua field dikirim sekaligus. Field yang tidak dikirim bisa menimpa nilai lama dengan kosong (perlu diperiksa saat Zod ditambahkan).

#### `PATCH /anime/:anim_id/increment`
- **Body:** tidak ada
- **Sukses 200:** `data: Anime` (episode +1)
- **Error:** 404 tidak ditemukan

#### `DELETE /anime/:anim_id`
- **Sukses 200:** `message` saja
- **Error:** 404 tidak ditemukan di watchlist

### Katalog AniList (publik, tanpa auth)

#### `GET /catalog/anime?q=<kata kunci>`
- **Query:** `q` (opsional). Jika kosong, mengembalikan top 50 berdasarkan skor.
- **Sukses 200:** `data: [ { id, title: { romaji, english, native }, episodes, format, status, averageScore, coverImage: { large } } ]`
- **Catatan:** pencarian maksimal 20 hasil. Belum ada timeout dan cache.

#### `GET /catalog/anime/:id`
- **Param:** `id` = ID AniList
- **Sukses 200:** `data: Media` (detail lengkap dari AniList)
- **Catatan:** field deskripsi bisa berisi HTML, wajib disanitasi di frontend.

---

## 3. Endpoint Rencana (dari PRD, belum ada)

| Method | Path (PRD) | Fase | Catatan |
|---|---|---|---|
| POST | `/auth/logout` | 1 | hapus cookie |
| GET | `/auth/me` | 1 | pengganti `/auth/profile`? |
| GET | `/users/:username` | 2 | profil publik + statistik |
| PUT | `/users/profile` | 2 | ubah bio, nama tampilan, avatar |
| POST | `/users/:id/follow` | 2 | toggle follow |
| GET | `/posts?page=&limit=` | 3 | feed berpaginasi |
| POST | `/posts` | 3 | buat post |
| POST | `/posts/:id/like` | 3 | toggle like |
| GET | `/posts/:id/comments` | 3 | thread komentar |
| POST | `/posts/:id/comments` | 3 | komentar atau balasan |
| GET | `/anime/:id/reviews` | 4 | review per anime |
| POST | `/reviews` | 4 | tulis atau ubah review |

**Keputusan yang belum diambil:** path watchlist di kode (`/anime`, `/catalog/anime`) berbeda dari PRD (`/watchlist`, `/anime/search`). Pilih satu, lalu samakan kode dan PRD.

---

## 4. Template Endpoint Baru (salin saat menambah)

```
#### `METHOD /path/:param`
- **Auth:** ya / tidak (role jika perlu)
- **Param / Query:** nama, tipe, keterangan
- **Body:**

| Field | Tipe | Wajib | Aturan Zod / default |
|---|---|---|---|
| ... | ... | ... | ... |

- **Sukses [kode]:** `data: { ... }`
- **Error:** [kode] kondisi
- **Catatan:** efek samping, batas, hal yang perlu diketahui frontend
```

## 5. Log Perubahan
- 2026-11-01: File dibuat, diisi dari kode saat ini.
