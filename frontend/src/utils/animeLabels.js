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
  FINISHED: "Selesai",
  RELEASING: "Tayang",
  NOT_YET_RELEASED: "Belum tayang",
  CANCELLED: "Dibatalkan",
  HIATUS: "Hiatus",
};

export function formatLabel(format) {
  if (!format) return null;
  return FORMAT_LABELS[format] ?? format.replaceAll("_", " ");
}

export function statusLabel(status) {
  if (!status) return "-";
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}
