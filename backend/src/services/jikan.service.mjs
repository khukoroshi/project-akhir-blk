import https from "https";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

const requestJikan = (url) => {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        family: 4,
        headers: {
          Accept: "application/json",
          "User-Agent": "AniWatchList/1.0",
        },
      },
      (response) => {
        let data = "";

        response.setEncoding("utf8");

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          let json;

          try {
            json = JSON.parse(data);
          } catch {
            const error = new Error(
              "Jikan mengembalikan response yang bukan JSON",
            );

            error.statusCode = response.statusCode || 500;

            reject(error);
            return;
          }

          if (response.statusCode < 200 || response.statusCode >= 300) {
            const error = new Error(
              json?.message || `Jikan API error: ${response.statusCode}`,
            );

            error.statusCode = response.statusCode;

            reject(error);
            return;
          }

          resolve(json);
        });
      },
    );

    request.setTimeout(10000, () => {
      request.destroy();

      const error = new Error("Request ke Jikan timeout");
      error.statusCode = 504;

      reject(error);
    });

    request.on("error", (error) => {
      reject(error);
    });
  });
};

const getAnime = async (query = "") => {
  const url = query.trim()
    ? `${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}`
    : `${JIKAN_BASE_URL}/anime`;

  return await requestJikan(url);
};

const getAnimeByMalId = async (malId) => {
  return await requestJikan(`${JIKAN_BASE_URL}/anime/${malId}`);
};

const getAnimeEpisodes = async (malId) => {
  return await requestJikan(`${JIKAN_BASE_URL}/anime/${malId}/episodes`);
};

export { getAnime, getAnimeByMalId, getAnimeEpisodes };
