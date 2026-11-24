const MAX_GENRES = 3;
const DESCRIPTION_MAX_LENGTH = 220;
const ELLIPSIS = "...";

export const FEATURED_FETCH_COUNT = 16;
const FEATURED_MAX_ITEMS = 8;
const FEATURED_MIN_BANNERS = 5;

// &amp; must be decoded last so "&amp;lt;" becomes "&lt;", not "<".
const ENTITIES = [
  ["&lt;", "<"],
  ["&gt;", ">"],
  ["&quot;", '"'],
  ["&#039;", "'"],
  ["&#39;", "'"],
  ["&amp;", "&"],
];

const decodeEntities = (text) =>
  ENTITIES.reduce((acc, [from, to]) => acc.replaceAll(from, to), text);

// Turns AniList HTML into short plain text. Returns null when nothing is left.
export const toPlainText = (html, maxLength = DESCRIPTION_MAX_LENGTH) => {
  if (typeof html !== "string") return null;

  const text = decodeEntities(
    html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, ""),
  )
    .replace(/\s+/g, " ")
    .trim();

  if (text === "") return null;
  if (text.length <= maxLength) return text;

  const limit = maxLength - ELLIPSIS.length;
  let cut = text.slice(0, limit);

  // Cut at a word boundary unless the cut already falls on a space.
  if (text[limit] !== " ") {
    const lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  }

  return `${cut.trimEnd()}${ELLIPSIS}`;
};

// Keeps the item untouched unless it has more than MAX_GENRES genres.
export const limitGenres = (item) =>
  Array.isArray(item?.genres) && item.genres.length > MAX_GENRES
    ? { ...item, genres: item.genres.slice(0, MAX_GENRES) }
    : item;

const toFeaturedItem = (item) => ({
  id: item.id,
  title: item.title,
  bannerImage: item.bannerImage ?? null,
  coverImage: {
    extraLarge: item.coverImage?.extraLarge ?? null,
    large: item.coverImage?.large ?? null,
    color: item.coverImage?.color ?? null,
  },
  format: item.format ?? null,
  episodes: item.episodes ?? null,
  status: item.status,
  averageScore: item.averageScore ?? null,
  genres: (item.genres ?? []).slice(0, MAX_GENRES),
  season: item.season ?? null,
  seasonYear: item.seasonYear ?? null,
  description: toPlainText(item.description),
});

// Keep items with a banner. If fewer than FEATURED_MIN_BANNERS, fill with
// items that only have a large cover. Never more than FEATURED_MAX_ITEMS.
export const pickFeatured = (media) => {
  const withBanner = media.filter((item) => item.bannerImage);
  let picked = withBanner;

  if (withBanner.length < FEATURED_MIN_BANNERS) {
    const filler = media.filter(
      (item) => !item.bannerImage && item.coverImage?.extraLarge,
    );
    picked = [...withBanner, ...filler];
  }

  return picked.slice(0, FEATURED_MAX_ITEMS).map(toFeaturedItem);
};
