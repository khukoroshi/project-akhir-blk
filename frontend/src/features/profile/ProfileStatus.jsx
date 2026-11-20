import { Link } from "react-router-dom";

export function ProfileSkeleton() {
  return (
    <div role="status" aria-busy="true" className="animate-pulse space-y-6">
      <span className="sr-only">Memuat profil...</span>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileError({ error, onRetry }) {
  const isNotFound = error.status === 404 || error.status === 400;
  const isRateLimited = error.status === 429;
  const isNetworkError = error.status === null;

  let title = "Terjadi kesalahan";
  let message =
    error.message ?? "Profil tidak bisa dimuat saat ini. Coba lagi nanti.";

  if (isNotFound) {
    title = "Pengguna tidak ditemukan";
    message = "Periksa kembali nama pengguna pada alamat halaman.";
  } else if (isRateLimited) {
    title = "Terlalu banyak permintaan";
    message = error.message ?? "Terlalu banyak permintaan. Coba lagi nanti.";
  } else if (isNetworkError) {
    title = "Tidak dapat terhubung";
    message = "Tidak dapat terhubung ke server. Periksa koneksi internet kamu.";
  }

  return (
    <div
      role="alert"
      className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"
    >
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        {title}
      </h1>

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {message}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {isNotFound && (
          <Link
            to="/"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Kembali ke Home
          </Link>
        )}

        {!isNotFound && !isRateLimited && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
}
