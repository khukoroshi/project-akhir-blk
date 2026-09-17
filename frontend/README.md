1. File di Level Luar (Root Level)

    index.html: Di Vite, file HTML berada di akar proyek (root), bukan di dalam folder public. File ini adalah pintu masuk utama (entry point) HTML yang memanggil src/main.jsx.

    vite.config.js: File konfigurasi utama Vite. Tempat Anda mengatur plugin (misal: React plugin, Tailwind CSS), alias path (seperti @/ untuk menggantikan ../../), atau port server.

    package.json: Menampung daftar dependensi (library), metadata proyek, dan perintah script (seperti npm run dev atau npm run build).

    .env.example: Contoh variabel lingkungan (seperti URL API). Catatan: Di Vite, variabel di file .env harus diawali dengan prefix VITE_ (contoh: VITE_API_URL).

2. Folder public/

    Menampung aset statis murni yang tidak perlu diproses oleh Vite saat proses build.

    File di sini bisa diakses langsung via URL root (misalnya /favicon.ico).

3. Folder src/ (Source Code)

Di sinilah seluruh kode aplikasi React Anda berada.

    main.jsx: Pintu masuk JavaScript utama tempat React di-mount ke elemen <div id="root"> di index.html.

    App.jsx: Komponen induk teratas React yang biasanya berisi konfigurasi Router atau Provider global.

    assets/: Menampung gambar, logo, ikon, atau CSS global yang akan diproses/di-bundle oleh Vite.

    components/: Tempat menampung komponen React yang reusable (dapat dipakai ulang).

        common/: Komponen UI umum seperti Button, Input, Modal, Navbar.

        features/: Komponen spesifik untuk fitur tertentu (misal: CartItem.jsx, PaymentForm.jsx).

    pages/: Komponen yang mewakili satu halaman utuh (misal: Halaman Home, Dashboard, Settings).

    layouts/: Komponen pembungkus tata letak halaman (misalnya kombinasi Navbar + Sidebar + Footer).

    hooks/: Tempat menyimpan Custom React Hooks buatan sendiri (misal: useFetch.js, useLocalStorage.js).

    services/: Tempat logika komunikasi dengan API luar (misal: konfigurasi axios atau fungsi fetch data).

    utils/: Tempat fungsi-fungsi pembantu umum murni JavaScript yang tidak mengandung elemen UI (misal: format tanggal, kalkulasi mata uang).
