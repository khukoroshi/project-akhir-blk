import db from "../config/db.mjs";
import AppError from "../utils/appError.mjs";
import { getAnimeDetail } from "./anilist.service.mjs";

const STALE_AFTER_DAYS = 7;

const FORMAT_TO_TYPE = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Music",
};

const toCatalogRow = (media) => ({
  title: (
    media.title?.english ||
    media.title?.romaji ||
    media.title?.native ||
    "Unknown"
  ).slice(0, 255),
  coverImage: media.coverImage?.large ?? null,
  totalEpisodes: media.episodes || 0,
  type: Object.hasOwn(FORMAT_TO_TYPE, media.format)
    ? FORMAT_TO_TYPE[media.format]
    : "TV",
});

// Staleness is computed in SQL so it uses the database clock only.
const findCatalogRow = async (externalId, source) => {
  const [rows] = await db.execute(
    `SELECT id, total_episodes,
            (synced_at IS NULL
             OR synced_at < NOW() - INTERVAL ${STALE_AFTER_DAYS} DAY) AS is_stale
     FROM anime_catalog
     WHERE external_id = ? AND source = ?`,
    [externalId, source],
  );
  return rows[0] ?? null;
};

// Returns { id, total_episodes } for a catalog row that exists and is fresh
// enough. AniList is the source of truth. The network call is made outside
// any DB transaction. A failed refresh of an existing row is not an error.
export const ensureCatalogEntry = async (externalId, source = "anilist") => {
  const existing = await findCatalogRow(externalId, source);
  if (existing && Number(existing.is_stale) !== 1) return existing;

  let media;
  try {
    media = await getAnimeDetail(externalId); // uses cache + AniList error mapping
    if (!media) throw new AppError("Anime tidak ditemukan di AniList", 404);
  } catch (error) {
    if (existing) return existing; // best effort: keep the old row
    throw error; // 404 / 429 / 502 / 504 as already defined
  }

  const row = toCatalogRow(media);

  // Upsert: two users adding the same new anime at once are both safe.
  await db.execute(
    `INSERT INTO anime_catalog
       (external_id, source, title, cover_image, total_episodes, anim_type, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       cover_image = VALUES(cover_image),
       total_episodes = VALUES(total_episodes),
       anim_type = VALUES(anim_type),
       synced_at = NOW()`,
    [
      externalId,
      source,
      row.title,
      row.coverImage,
      row.totalEpisodes,
      row.type,
    ],
  );

  return await findCatalogRow(externalId, source);
};
