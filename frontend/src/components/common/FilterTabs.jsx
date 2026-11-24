import { Link } from "react-router-dom";
import { CATALOG_FILTERS, buildCatalogPath } from "../../utils/catalogFilters";
import { X } from "./icons";

const base =
  "inline-flex min-h-11 shrink-0 items-center rounded-md border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";
const active = "border-accent-emphasis bg-accent-emphasis text-on-accent";
const idle = "border-border bg-canvas text-fg hover:border-border-strong";

// activeKey = null means no tab is active (while searching).
// query = current search keyword; shows a removable chip when set.
function FilterTabs({ activeKey, query = "", view = "grid", className = "" }) {
  return (
    <div className={className}>
      <nav aria-label="Anime categories">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATALOG_FILTERS.map(({ key, label }) => {
            const isActive = key === activeKey;
            return (
              <Link
                key={key}
                to={buildCatalogPath({ filter: key, view })}
                aria-current={isActive ? "page" : undefined}
                className={`${base} ${isActive ? active : idle}`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {query && (
        <div className="mt-3 inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-canvas pl-3 text-sm text-fg">
          <span className="truncate">Results for “{query}”</span>
          <Link
            to={buildCatalogPath({ view })}
            aria-label="Clear search"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          >
            <X className="size-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default FilterTabs;
