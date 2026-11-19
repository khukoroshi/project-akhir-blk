import Anime from "./watchlist.model.mjs";

const STATUSES = ["watching", "completed", "dropped", "plan to watch"];
const SCORE_KEYS = Array.from({ length: 10 }, (_, i) => String(i + 1));

export const getUserStats = async (userId) => {
  const { statusRows, scoreRows, mean } = await Anime.getStatsByUser(userId);

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  let total = 0;
  let episodesWatched = 0;
  for (const row of statusRows) {
    total += Number(row.total);
    episodesWatched += Number(row.episodes);
    if (Object.hasOwn(byStatus, row.status)) {
      byStatus[row.status] = Number(row.total);
    }
  }

  // Key = integer part of the score (8.5 -> "8"). Always 10 keys.
  const scoreDistribution = Object.fromEntries(SCORE_KEYS.map((k) => [k, 0]));
  for (const row of scoreRows) {
    const key = String(Math.floor(Number(row.bucket)));
    if (Object.hasOwn(scoreDistribution, key)) {
      scoreDistribution[key] = Number(row.total);
    }
  }

  return {
    total,
    byStatus,
    episodesWatched,
    meanScore: mean === null ? null : Number(mean),
    scoreDistribution,
  };
};
