import axios from "axios";
const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

// Bikin default header agar tidak perlu ditulis berulang kali
const FETCH_OPTIONS = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
};

const getAnime = async (query = "") => {
  const url = query.trim()
    ? `${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}`
    : `${JIKAN_BASE_URL}/anime`;

  console.log(url);

  const response = await axios.get(url);
  return response.data;
  // console.log("STATUS JIKAN:", response.status);

  // // const data = await response.json();

  // // console.log("RESPONSE JIKAN:", data);

  // if (!response.ok) {
  //   const error = new Error(`Jikan API error: ${response.status}`);
  //   error.statusCode = response.status;
  //   throw error;
  // }

  // return await response.json();
};

const getAnimeByMalId = async (malId) => {
  const response = await fetch(
    `${JIKAN_BASE_URL}/anime/${malId}`,
    FETCH_OPTIONS,
  );

  if (!response.ok) {
    const error = new Error(`Jikan API error: ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  return await response.json();
};

const getAnimeEpisodes = async (malId) => {
  const response = await fetch(
    `${JIKAN_BASE_URL}/anime/${malId}/episodes`,
    FETCH_OPTIONS,
  );

  if (!response.ok) {
    const error = new Error(`Jikan API error: ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  return await response.json();
};

export { getAnime, getAnimeByMalId, getAnimeEpisodes };
