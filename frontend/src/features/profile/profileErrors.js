/*
 * Pesan error untuk aksi (simpan profil, follow). 401 mengembalikan
 * null karena sudah ditangani interceptor (user dikosongkan lalu
 * dialihkan ke /login).
 */
export function toActionMessage(error) {
  const status = error?.response?.status;

  if (status === 401) return null;

  if (status === 403) {
    return "Sesi tidak valid. Muat ulang halaman lalu coba lagi.";
  }

  if (!error?.response) {
    return "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.";
  }

  return error.response.data?.message || "Terjadi kesalahan. Coba lagi nanti.";
}
