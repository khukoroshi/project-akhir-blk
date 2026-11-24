const FORMAT_LABELS = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Music",
};

const STATUS_LABELS = {
  FINISHED: "Finished",
  RELEASING: "Airing",
  NOT_YET_RELEASED: "Not yet released",
  CANCELLED: "Cancelled",
  HIATUS: "Hiatus",
};

const SEASON_LABELS = {
  WINTER: "Winter",
  SPRING: "Spring",
  SUMMER: "Summer",
  FALL: "Fall",
};

export function seasonLabel(season) {
  if (!season) return null;
  return SEASON_LABELS[season] ?? null;
}

// Romaji first, then English, then native. Use for every AniList title.
// Watchlist titles (anim_title) are shown as-is, not through this helper.
export function getAnimeTitle(title) {
  return title?.romaji || title?.english || title?.native || "Untitled";
}

export function formatLabel(format) {
  if (!format) return null;
  return FORMAT_LABELS[format] ?? format.replaceAll("_", " ");
}

export function statusLabel(status) {
  if (!status) return "-";
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}
