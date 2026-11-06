Chat pagination

File yang dipilih dari GitHub (8):

backend/src/services/anilist.service.mjs
backend/src/controllers/anilist.controller.mjs
backend/src/routes/anilist.routes.mjs
backend/src/middlewares/validate.middleware.mjs
backend/src/validators/anim.validator.mjs (contoh gaya schema)
frontend/src/pages/Home.jsx
komponen grid kartu anime (cek apakah AnimeList.jsx atau DaftarAnime.jsx)
frontend/src/pages/AnimeDetail.jsx (hanya untuk tombol kembali)
Tugas: pagination katalog AniList, 48 judul per halaman.

Backend:

1. GET /catalog/anime menerima query page (bilangan bulat >= 1, default 1,
   maks 200). perPage tetap di server (48), tidak diterima dari client.
   Validasi dengan Zod (query), gaya sama dengan validator yang ada
   (buat validators/anilist.validator.mjs).
2. Satu request AniList per halaman (perPage 48, parameter page).
   Pencarian dan daftar top memakai ukuran yang sama. Cache 5 menit tetap
   dipakai, tapi kunci cache wajib memuat page.
3. Response: data tetap array. Tambahkan field meta: { page, perPage,
   hasNextPage } (hasNextPage dari pageInfo AniList). Tidak perlu lastPage.
   Batasi daftar top maksimal 10 halaman.
4. Jangan ubah endpoint detail dan penanganan error 429/502/504.

Frontend: 5. Komponen Pagination di components/common: tombol Sebelumnya, penanda
"Halaman X", tombol Berikutnya. Tailwind, mode terang dan gelap sesuai
tema yang ada. <nav aria-label="Pagination">. Sebelumnya nonaktif di
halaman 1, Berikutnya nonaktif jika hasNextPage false. 6. Home.jsx: page disimpan di URL (?q=...&page=...) lewat useSearchParams
yang sudah ada; q dan page keduanya dipertahankan. Pencarian baru
kembali ke page 1. Saat pindah halaman, gulir ke atas. 7. Periksa jumlah kolom grid di semua breakpoint. Jika ada yang memakai
5 kolom, beri tahu saya sebelum menulis kode (48 tidak habis dibagi 5). 8. AnimeDetail.jsx: cek tombol kembali. Jika berupa <Link to="/">, ganti:
jika ada riwayat browser, kembali ke halaman sebelumnya; jika tidak
(halaman dibuka langsung), arahkan ke "/".

Selesai jika: halaman 1 menampilkan 48 judul; Berikutnya memuat halaman 2;
cari, buka detail, Back mempertahankan kata kunci dan halaman; refresh
juga; request yang sama dalam 5 menit tidak memanggil AniList lagi.
Beri hanya bagian yang diubah. Di akhir beri blok perubahan API.md
(parameter page dan field meta) dan blok serah-terima PROGRESS.md.
Chat filter

Kerjakan setelah pagination di-commit dan di-push. File dipilih ulang: anilist.service.mjs, anilist.controller.mjs, anilist.validator.mjs (baru dari chat pagination), Home.jsx, dan komponen Pagination yang baru dibuat.

Tugas: filter kategori katalog di Home (tab seperti MyAnimeList).

Backend:

1. GET /catalog/anime menerima query filter (enum Zod): all, airing,
   upcoming, tv, movie, ova, ona, special, popular, favorited. Default all.
2. Petakan di server ke parameter AniList (jangan teruskan nilai client
   langsung):
   - all: urutan skor tertinggi
   - airing: status sedang tayang, urutan skor
   - upcoming: status belum tayang, urutan popularitas
   - tv / movie / ova / ona / special: format yang sesuai, urutan skor
   - popular: urutan popularitas
   - favorited: urutan favorit
     Verifikasi nama enum dan argumen ke dokumentasi AniList (MediaFormat,
     MediaStatus, MediaSort) sebelum menulis kode. Pastikan konten dewasa
     tidak tampil (isAdult: false).
3. Filter hanya berlaku tanpa kata kunci q. Jika q ada, filter diabaikan.
   Kunci cache memuat filter dan page. Pagination yang ada tidak berubah.

Frontend: 4. Tab kategori di atas daftar di Home.jsx (10 tab di atas), scroll
horizontal di layar kecil, tab aktif jelas, aksesibel (nav/tablist
dengan aria-current). Tema terang dan gelap sesuai yang ada. 5. Filter disimpan di URL (?filter=airing), bersama q dan page. Klik tab
menghapus q dan mengembalikan page ke 1. Mencari menghapus filter.
Back dan refresh mempertahankan tab dan halaman.

Selesai jika: tiap tab menampilkan daftar yang sesuai dan berpaginasi;
Back dan refresh mempertahankan tab; pencarian tetap berfungsi.
Beri hanya bagian yang diubah. Di akhir beri blok perubahan API.md
(parameter filter) dan blok serah-terima PROGRESS.md.

Dua catatan: Top Airing dan Top Upcoming memakai AniList yang menampilkan data terkini, jadi isinya bisa berubah antar hari. Selain itu, tiap tab dan halaman yang belum di-cache memanggil AniList, dan dokumentasinya menyebut batas sementara 30 request per menit. Cache 5 menit yang sudah ada mengurangi masalah ini. Kalau kamu sering mendapat error 429 saat mencoba tab satu per satu, itu sebabnya.
