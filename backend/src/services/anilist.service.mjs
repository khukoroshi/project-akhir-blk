const ANILIST_URL = "https://graphql.anilist.co";

const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

const cache = new Map();

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
  query ($search: String!) {
    Page(perPage: 20) {
      media(
        search: $search
        type: ANIME
      ) {
        id

        title {
          romaji
          english
          native
        }

        episodes
        format
        status
        averageScore

        coverImage {
          large
        }
      }
    }
  }
`;

const ANIME_TOP_QUERY = `
  {
    Page(page: 1, perPage: 60) {
      media(
        type: ANIME
        sort: SCORE_DESC
        isAdult: false
      ) {
        id

        title {
          romaji
          english
          native
        }

        episodes
        format
        status
        averageScore

        coverImage {
          large
        }
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

const requestAniList = async (query, variables = {}) => {
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
      throw createError(
        "AniList tidak merespons (timeout). Coba lagi nanti.",
        504,
      );
    }
    throw createError("Tidak dapat terhubung ke AniList.", 502);
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("Retry-After"));
    const wait = retryAfter > 0 ? `${retryAfter} detik` : "beberapa saat";

    throw createError(
      `Terlalu banyak permintaan ke AniList. Coba lagi dalam ${wait}.`,
      429,
    );
  }

  let result = null;
  try {
    result = JSON.parse(text);
  } catch {
    // Non-JSON body (e.g. HTML error page), handled below.
  }

  if (!response.ok) {
    throw createError(
      result?.errors?.[0]?.message || `AniList API error: ${response.status}`,
      response.status,
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
    throw createError("ID anime tidak valid", 400);
  }

  const cacheKey = `detail:${numericId}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  const data = await requestAniList(ANIME_DETAIL_QUERY, { id: numericId });

  setCached(cacheKey, data.Media);
  return data.Media;
};

const getAnime = async (query = "") => {
  const search = query.trim();
  const cacheKey = search ? `search:${search.toLowerCase()}` : "top";

  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  const data = search
    ? await requestAniList(ANIME_SEARCH_QUERY, { search })
    : await requestAniList(ANIME_TOP_QUERY);

  setCached(cacheKey, data.Page.media);
  return data.Page.media;
};

export { getAnime, getAnimeDetail };
