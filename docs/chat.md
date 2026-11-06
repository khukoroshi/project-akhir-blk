Chat berikutnya: UX frontend

Kerjakan sesudah chat frontend kecil (skor desimal). Di Chat #3 nanti alur login ikut diubah, jadi bug login lebih baik diperbaiki sekarang. Setelah #3 selesai, ujinya diulang.

File yang dipilih dari GitHub (4):

frontend/src/context/AuthProvider.jsx
frontend/src/components/features/aunt/LoginForm.jsx
frontend/src/components/common/Navbar.jsx
frontend/src/pages/Home.jsx
Tugas: perbaikan UX frontend (2 bug). Jangan ubah backend.

Bug 1: setelah login, navbar (status user) dan tab MyList baru muncul
setelah refresh browser.
Dugaan: LoginForm membaca response.data.data.userInfo, padahal API login
mengembalikan data.user (lihat API.md), sehingga login(token, undefined)
membuat isAuthenticated false. Verifikasi di kode, lalu perbaiki. Hapus
console.log yang mencetak respons login (berisi token). Pastikan setelah
navigate("/") navbar langsung menampilkan status user dan tab MyList, dan
logout membersihkan state dengan benar.

Bug 2: dari Home, saya cari anime lalu buka detail, lalu tekan Back
(Alt+panah kiri): tampilan kembali ke daftar top anime, bukan hasil
pencarian. Pindahkan kata kunci pencarian ke URL query (/?q=naruto)
memakai useSearchParams sebagai sumber kebenaran, sehingga Back, refresh,
dan link yang dibagikan mengembalikan hasil pencarian yang sama.
Jangan memakai localStorage.

Selesai jika: login langsung menampilkan tab dan status tanpa refresh;
cari, buka detail, lalu Back menampilkan hasil pencarian lagi; membuka /
tanpa q tetap menampilkan top anime.
Beri hanya bagian yang diubah. Di akhir beri blok serah-terima PROGRESS.md
(hapus dua bullet bug UX di bagian 8).

Untuk tugas 60 judul, prompt dan daftar file kubuatkan setelah kamu memilih caranya. Mana yang kamu inginkan: 60 judul tampil sekaligus di Home, atau pagination/”muat lebih banyak”? Satu hal lagi: pencarian sekarang dibatasi 20 hasil, dan jumlah itu perlu kamu putuskan ikut 60 atau tetap 20.

Chat berikutnya: pagination

Jangan dikerjakan bersamaan dengan chat UX (login dan Back). Keduanya mengubah Home.jsx, dan hasil yang bertabrakan sulit dilacak.

File yang dipilih dari GitHub:

backend/src/services/anilist.service.mjs
backend/src/controllers/anilist.controller.mjs
backend/src/routes/anilist.routes.mjs
backend/src/middlewares/validate.middleware.mjs
backend/src/validators/anim.validator.mjs (contoh gaya schema)
frontend/src/pages/Home.jsx
File komponen yang menampilkan grid kartu anime (cek apakah AnimeList.jsx atau DaftarAnime.jsx)
Tugas: pagination katalog AniList, 48 judul per halaman.

Backend:

1. GET /catalog/anime terima query page (bilangan bulat >= 1, default 1,
   maks 200). perPage tetap di server (48), jangan diterima dari client.
   Validasi dengan Zod (query), gaya sama dengan validator yang ada.
2. Satu request AniList per halaman (perPage 48, parameter page).
   Pencarian dan daftar top memakai ukuran yang sama. Cache 5 menit yang
   ada tetap dipakai, tapi kunci cache wajib memuat page.
3. Response: data tetap berupa array. Tambahkan field meta:
   { page, perPage, hasNextPage, lastPage }. Nilai lastPage dari AniList
   dianggap perkiraan. Batasi daftar top maksimal 10 halaman.
4. Jangan ubah endpoint detail dan error handling 429/502/504.

Frontend: 5. Buat komponen Pagination di components/common: « Sebelumnya,
nomor halaman dengan elipsis (1 2 3 … N), Berikutnya ». Tailwind,
dukung mode terang dan gelap sesuai tema yang ada. Gunakan

   <nav aria-label="Pagination"> dan aria-current pada halaman aktif.
   Tombol Berikutnya nonaktif jika hasNextPage false.
6. Home.jsx: page dan q disimpan di URL (?q=...&page=...) lewat
   useSearchParams (jika bagian q sudah ada dari tugas sebelumnya,
   pertahankan dan tambah page). Pencarian baru kembali ke page 1. Saat
   pindah halaman, gulir ke atas.
7. Periksa jumlah kolom grid di semua breakpoint. Jika memakai 5 kolom,
   beri tahu saya sebelum menulis kode (48 tidak habis dibagi 5).

Selesai jika: halaman 1 menampilkan 48 judul; Berikutnya memuat halaman
2; Back dan refresh mempertahankan halaman dan kata kunci; request yang
sama dalam 5 menit tidak memanggil AniList lagi.
Beri hanya bagian yang diubah. Di akhir beri blok perubahan API.md
(parameter page dan field meta) dan blok serah-terima PROGRESS.md.

Urutan kerjanya sekarang: chat frontend kecil (skor desimal dan Register), chat UX (login dan Back), lalu chat pagination ini. Setelah itu baru #8 dan #3. Kalau sebagian tugas frontend sudah selesai, sesuaikan saja dan beri tahu aku supaya daftar filenya kusesuaikan.
