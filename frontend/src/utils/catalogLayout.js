// Single source of truth for catalog grid classes.
// Used by DaftarAnime and AnimeGridSkeleton.
const GRID_CLASSES =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6";
const LIST_CLASSES =
  "grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3";

export function getLayoutClasses(view) {
  return view === "list" ? LIST_CLASSES : GRID_CLASSES;
}
