const ANILIST_URL = "https://graphql.anilist.co";

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
    Page(page: 1, perPage: 50) {
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

const getAnimeDetail = async (id) => {
  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: ANIME_DETAIL_QUERY,
      variables: {
        id: Number(id),
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    const error = new Error(
      result?.errors?.[0]?.message || `AniList API error: ${response.status}`,
    );

    error.statusCode = response.status;
    throw error;
  }

  if (result.errors) {
    const error = new Error(
      result.errors[0]?.message || "AniList GraphQL error",
    );

    error.statusCode = 502;
    throw error;
  }

  return result.data.Media;
};

const requestAniList = async (query, variables = {}) => {
  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    const error = new Error(
      result?.errors?.[0]?.message || `AniList API error: ${response.status}`,
    );

    error.statusCode = response.status;
    throw error;
  }

  if (result.errors) {
    const error = new Error(
      result.errors[0]?.message || "AniList GraphQL error",
    );

    error.statusCode = 502;
    throw error;
  }

  return result.data.Page.media;
};

const getAnime = async (query = "") => {
  if (!query.trim()) {
    return await requestAniList(ANIME_TOP_QUERY);
  }

  return await requestAniList(ANIME_SEARCH_QUERY, {
    search: query,
  });
};

export { getAnime, getAnimeDetail };
