import { Link } from "react-router-dom";
import { CATALOG_FILTERS } from "../../utils/catalogFilters";

const base = "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition";
const active = "bg-indigo-600 text-white shadow-sm";
const idle =
  "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800";

// activeKey = null means no tab is active (e.g. while searching).
function FilterTabs({ activeKey }) {
  return (
    <nav aria-label="Kategori anime" className="mb-6">
      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATALOG_FILTERS.map(({ key, label }) => {
          const isActive = key === activeKey;
          return (
            <Link
              key={key}
              to={key === "all" ? "/" : `/?filter=${key}`}
              aria-current={isActive ? "page" : undefined}
              className={`${base} ${isActive ? active : idle}`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default FilterTabs;
