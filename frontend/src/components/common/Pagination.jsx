const buttonClass =
  "inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:hover:bg-slate-900";

function Pagination({
  page,
  hasNextPage,
  onPageChange,
  className = "mt-8",
  label = "Pagination",
}) {
  return (
    <nav
      aria-label={label}
      className={`flex items-center justify-center gap-3 ${className}`}
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={buttonClass}
      >
        Sebelumnya
      </button>

      <span
        aria-current="page"
        className="min-w-24 text-center text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        Halaman {page}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
        className={buttonClass}
      >
        Berikutnya
      </button>
    </nav>
  );
}

export default Pagination;
