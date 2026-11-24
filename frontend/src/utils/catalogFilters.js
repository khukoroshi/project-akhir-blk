export const CATALOG_FILTERS = [
  { key: "all", label: "All Anime", title: "Top Anime" },
  { key: "airing", label: "Top Airing", title: "Top Airing Anime" },
  { key: "upcoming", label: "Top Upcoming", title: "Top Upcoming Anime" },
  { key: "tv", label: "Top TV Series", title: "Top TV Series" },
  { key: "movie", label: "Top Movies", title: "Top Movies" },
  { key: "ova", label: "Top OVAs", title: "Top OVAs" },
  { key: "ona", label: "Top ONAs", title: "Top ONAs" },
  { key: "special", label: "Top Specials", title: "Top Specials" },
  { key: "popular", label: "Most Popular", title: "Most Popular Anime" },
  { key: "favorited", label: "Most Favorited", title: "Most Favorited Anime" },
];

export function parseCatalogView(raw) {
  return raw === "list" ? "list" : "grid";
}

// Builds a catalog URL. q wins over filter (searching clears the filter).
// Defaults (all filter, page 1, grid view) are left out of the URL.
export function buildCatalogPath({ q, filter, page, view } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  else if (filter && filter !== "all") params.set("filter", filter);
  if (page > 1) params.set("page", String(page));
  if (view === "list") params.set("view", "list");
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
