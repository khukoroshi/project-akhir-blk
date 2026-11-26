import {
  FEATURED_FETCH_COUNT,
  limitGenres,
  pickFeatured,
} from "./anilist.format.mjs";
const ANILIST_URL = "https://graphql.anilist.co";

const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const FEATURED_CACHE_TTL_MS = 30 * 60 * 1000;
const PER_PAGE = 48;
const MAX_TOP_PAGES = 10;

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 2_500;
const BATCH_MAX_RETRIES = 3;
const BATCH_DEFAULT_WAIT_MS = 30_000;
const BATCH_MAX_WAIT_MS = 120_000;

const CATALOG_FILTERS = {
  all: { sort: ["SCORE_DESC"] },
  airing: { status: "RELEASING", sort: ["SCORE_DESC"] },
  upcoming: { status: "NOT_YET_RELEASED", sort: ["POPULARITY_DESC"] },
  tv: { format: "TV", sort: ["SCORE_DESC"] },
  movie: { format: "MOVIE", sort: ["SCORE_DESC"] },
  ova: { format: "OVA", sort: ["SCORE_DESC"] },
  ona: { format: "ONA", sort: ["SCORE_DESC"] },
  special: { format: "SPECIAL", sort: ["SCORE_DESC"] },
  popular: { sort: ["POPULARITY_DESC"] },
  favorited: { sort: ["FAVOURITES_DESC"] },
};

const cache = new Map();
// Single-slot cache for the featured list (own TTL, not shared with `cache`).
let featuredCache = null;

const getCached = (key) => {
  const entry = cache.get(key);

  if (!entry) return undefined;

  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return entry.value;
};

const setCached = (key, value) => {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Map keeps insertion order, so the first key is the oldest.
    cache.delete(cache.keys().next().value);
  }

  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ANIME_SEARCH_QUERY = `
  query ($search: String!, $page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
      }
      media(search: $search, type: ANIME, isAdult: false) {
        id
        title { romaji english native }
        episodes
        format
        status
        averageScore
        genres
        season
        seasonYear
        coverImage { large }
      }
    }
  }
`;

const ANIME_TOP_QUERY = `
  query ($page: Int!, $perPage: Int!, $sort: [MediaSort], $format: MediaFormat, $status: MediaStatus) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
      }
      media(type: ANIME, isAdult: false, sort: $sort, format: $format, status: $status) {
        id
        title { romaji english native }
        episodes
        format
        status
        averageScore
        genres
        season
        seasonYear
        coverImage { large }
      }
    }
  }
`;

const ANIME_DETAIL_QUERY = `
  query ($id: Int!) {
    Media(id: $id, type: ANIME) {
      id

      title {
        romaji
        english
        native
      }

      description(asHtml: false)

      episodes
      duration
      format
      status
      averageScore
      genres

      coverImage {
        large
        extraLarge
      }

      bannerImage

      startDate {
        year
        month
        day
      }

      endDate {
        year
        month
        day
      }
    }
  }
`;

const ANIME_FEATURED_QUERY = `
  query ($perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(type: ANIME, status: RELEASING, sort: TRENDING_DESC, isAdult: false) {
        id
        title { romaji english native }
        bannerImage
        coverImage { extraLarge large color }
        format
        episodes
        status
        averageScore
        genres
        season
        seasonYear
        description(asHtml: false)
      }
    }
  }
`;

const ANIME_BATCH_QUERY = `
  query ($ids: [Int], $page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      media(id_in: $ids, type: ANIME) {
        id
        title { romaji english native }
        episodes
        format
        coverImage { large }
      }
    }
  }
`;

const requestAniList = async (
  query,
  variables = {},
  { allowNotFound = false } = {},
) => {
  let response;
  let text;

  try {
    response = await fetch(ANILIST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    text = await response.text();
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw createError("AniList request timed out", 504);
    }
    throw createError("Could not reach AniList", 502);
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("Retry-After"));
    const wait =
      retryAfter > 0
        ? `in ${retryAfter} ${retryAfter === 1 ? "second" : "seconds"}`
        : "shortly";

    const error = createError(
      `AniList rate limit reached. Try again ${wait}`,
      429,
    );

    error.retryAfterSeconds = retryAfter > 0 ? retryAfter : null;
    throw error;
  }

  let result = null;
  try {
    result = JSON.parse(text);
  } catch {
    // Non-JSON body (e.g. HTML error page), handled below.
  }

  if (!response.ok) {
    // Only the detail endpoint treats AniList's 404 as "not found".
    if (allowNotFound && response.status === 404) {
      throw createError(
        result?.errors?.[0]?.message || "Anime not found on AniList",
        404,
      );
    }

    // Any other failure is an upstream problem, not the client's fault.
    throw createError(
      `AniList returned an error (${response.status}). Try again later`,
      502,
    );
  }

  if (!result || result.errors) {
    throw createError(
      result?.errors?.[0]?.message || "AniList GraphQL error",
      502,
    );
  }

  return result.data;
};

const getAnimeDetail = async (id) => {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw createError("Anime ID must be a positive whole number", 400);
  }

  const cacheKey = `detail:${numericId}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  const data = await requestAniList(
    ANIME_DETAIL_QUERY,
    { id: numericId },
    { allowNotFound: true },
  );

  setCached(cacheKey, data.Media);
  return data.Media;
};

const getAnime = async (query = "", page = 1, filter = "all") => {
  const search = query.trim();
  const filterKey = Object.hasOwn(CATALOG_FILTERS, filter) ? filter : "all";
  const cacheKey = search
    ? `search:${page}:${search.toLowerCase()}`
    : `top:${filterKey}:${page}`;

  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  const variables = { page, perPage: PER_PAGE };
  const data = search
    ? await requestAniList(ANIME_SEARCH_QUERY, { ...variables, search })
    : await requestAniList(ANIME_TOP_QUERY, {
        ...variables,
        ...CATALOG_FILTERS[filterKey],
      });

  // The top list is capped at MAX_TOP_PAGES, so the last page never has a next.
  const hasNextPage =
    Boolean(data.Page.pageInfo?.hasNextPage) &&
    (search !== "" || page < MAX_TOP_PAGES);

  const result = {
    items: data.Page.media.map(limitGenres),
    meta: { page, perPage: PER_PAGE, hasNextPage },
  };

  setCached(cacheKey, result);
  return result;
};

const getFeaturedAnime = async () => {
  if (featuredCache && featuredCache.expiresAt >= Date.now()) {
    return featuredCache.value;
  }

  const data = await requestAniList(ANIME_FEATURED_QUERY, {
    perPage: FEATURED_FETCH_COUNT,
  });
  const items = pickFeatured(data.Page?.media ?? []);

  featuredCache = {
    value: items,
    expiresAt: Date.now() + FEATURED_CACHE_TTL_MS,
  };
  return items;
};

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// One request for <= 50 ids. Retries only on 429 and honors Retry-After.
// Not cached: used by the maintenance script, not by user requests.
const fetchBatch = async (ids, { maxRetries, sleep }) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const data = await requestAniList(ANIME_BATCH_QUERY, {
        ids,
        page: 1,
        perPage: BATCH_SIZE,
      });
      return data.Page?.media ?? [];
    } catch (error) {
      if (error.statusCode !== 429 || attempt >= maxRetries) throw error;
      const wait = error.retryAfterSeconds
        ? error.retryAfterSeconds * 1000
        : BATCH_DEFAULT_WAIT_MS;
      await sleep(Math.min(wait, BATCH_MAX_WAIT_MS));
    }
  }
};

// Yields { ids, media } or { ids, error } per chunk of up to 50 ids, pausing
// between chunks. Ids AniList does not return are simply absent from media.
async function* getAnimeBatches(
  ids,
  {
    batchSize = BATCH_SIZE,
    delayMs = BATCH_DELAY_MS,
    maxRetries = BATCH_MAX_RETRIES,
    sleep = defaultSleep,
  } = {},
) {
  const size = Math.min(Math.max(1, batchSize), BATCH_SIZE);
  const unique = [...new Set(ids)];

  for (let start = 0; start < unique.length; start += size) {
    if (start > 0) await sleep(delayMs);
    const chunk = unique.slice(start, start + size);

    let result;
    try {
      result = {
        ids: chunk,
        media: await fetchBatch(chunk, { maxRetries, sleep }),
      };
    } catch (error) {
      result = { ids: chunk, error };
    }
    yield result;
  }
}

// Test-only: lets each test start with an empty cache. No behavior change.
const clearCacheForTests = () => {
  cache.clear();
  featuredCache = null;
};

export {
  getAnime,
  getAnimeDetail,
  getFeaturedAnime,
  getAnimeBatches,
  clearCacheForTests,
};
