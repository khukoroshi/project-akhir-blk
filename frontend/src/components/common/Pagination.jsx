import { ChevronLeft, ChevronRight } from "./icons";
import cx from "../../utils/cx";

const buttonClass =
  "inline-flex size-11 items-center justify-center rounded-md border border-border-strong bg-canvas text-fg transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-canvas";

// announce: only one instance per page should be a live region.
function Pagination({
  page,
  hasNextPage,
  onPageChange,
  className = "mt-8 justify-center",
  label = "Pagination",
  announce = true,
}) {
  return (
    <nav
      aria-label={label}
      className={cx("flex items-center gap-3", className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={buttonClass}
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>

      <span
        aria-live={announce ? "polite" : undefined}
        className="min-w-24 text-center text-sm font-semibold text-fg"
      >
        Page {page}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
        aria-label="Next page"
        className={buttonClass}
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
    </nav>
  );
}

export default Pagination;
