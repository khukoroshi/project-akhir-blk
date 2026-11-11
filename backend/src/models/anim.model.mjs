import db from "../config/db.mjs";
import AppError from "../utils/appError.mjs";
import { ensureCatalogEntry } from "../services/catalog.service.mjs";

// Aliases keep the response shape identical to the old `animes` table.
const SELECT_ANIME = `
  SELECT
    ua.id                AS anim_id,
    ua.user_id           AS us_id,
    c.external_id        AS external_id,
    c.source             AS external_source,
    c.title              AS anim_title,
    c.cover_image        AS anim_img_url,
    ua.episodes_watched  AS anim_current_episode,
    c.total_episodes     AS anim_total_episode,
    c.anim_type          AS anim_type,
    ua.status            AS anim_status,
    ua.tier              AS anim_tier,
    ua.score             AS anim_score,
    ua.notes             AS anim_personal_notes,
    ua.created_at        AS anim_created_at
  FROM user_anime ua
  JOIN anime_catalog c ON c.id = ua.anime_id`;

const Anime = {
  // Ambil semua watchlist milik user tertentu
  getAllAnime: async (usId) => {
    const query = `${SELECT_ANIME} WHERE ua.user_id = ? ORDER BY ua.id DESC`;
    const [rows] = await db.execute(query, [usId]);
    return rows;
  },

  getAnimeById: async (animId, usId) => {
    const query = `${SELECT_ANIME} WHERE ua.id = ? AND ua.user_id = ?`;
    const [rows] = await db.execute(query, [animId, usId]);
    return rows[0] || null;
  },

  // Tambah anime baru ke watchlist (menggunakan Stored Procedure)
  // Catalog data comes from AniList (see catalog.service). The old body fields
  // title, imgUrl, totalEps, type are deprecated and ignored.
  createWatchList: async (usId, data) => {
    const {
      externalId,
      externalSource = "anilist",
      status = "watching",
      tier = null,
      score = null,
      notes = null,
    } = data;

    const catalog = await ensureCatalogEntry(externalId, externalSource);

    // Business rule: completed + known total => episodes watched = total.
    const episodesWatched =
      status === "completed" && catalog.total_episodes > 0
        ? catalog.total_episodes
        : 0;

    const [result] = await db.execute(
      `INSERT INTO user_anime
         (user_id, anime_id, status, episodes_watched, score, tier, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usId, catalog.id, status, episodesWatched, score, tier, notes],
    );

    return await Anime.getAnimeById(result.insertId, usId);
  },

  // Update detail anime menggunakan Stored Procedure
  updateWatchList: async (animId, usId, data) => {
    const { eps, status, tier, score, notes } = data; // teps is deprecated, ignored

    const current = await Anime.getAnimeById(animId, usId);
    if (!current) return null;

    // The total always comes from the shared catalog, never from the client.
    const total = current.anim_total_episode;

    if (total > 0 && eps > total) {
      throw new AppError(
        `Episode (${eps}) tidak boleh melebihi total episode (${total})`,
        400,
      );
    }

    const epsReal = status === "completed" && total > 0 ? total : eps;

    let finalStatus = status;
    if (total > 0 && epsReal >= total) {
      finalStatus = "completed";
    }

    await db.execute(
      `UPDATE user_anime
       SET episodes_watched = ?, status = ?, tier = ?, score = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [epsReal, finalStatus, tier, score, notes, animId, usId],
    );

    return await Anime.getAnimeById(animId, usId);
  },

  // Fitur Quick +1 Episode (Memanfaatkan sp_update_anime)
  incrementEpisode: async (animId, usId) => {
    const currentAnime = await Anime.getAnimeById(animId, usId);

    if (!currentAnime) {
      return null;
    }

    // Jangan melebihi total episode
    if (
      currentAnime.anim_total_episode > 0 &&
      currentAnime.anim_current_episode >= currentAnime.anim_total_episode
    ) {
      return currentAnime;
    }

    const newEps = currentAnime.anim_current_episode + 1;
    return await Anime.updateWatchList(animId, usId, {
      eps: newEps,
      // teps: currentAnime.anim_total_episode ?? 0,
      status: currentAnime.anim_status,
      tier: currentAnime.anim_tier ?? null,
      score: currentAnime.anim_score ?? null,
      notes: currentAnime.anim_personal_notes ?? null,
    });
  },

  // Hapus anime dari watchlist
  deleteWatchList: async (animId, usId) => {
    const query = "DELETE FROM user_anime WHERE id = ? AND user_id = ?";
    const [result] = await db.execute(query, [animId, usId]);
    return result.affectedRows;
  },
};

export default Anime;
