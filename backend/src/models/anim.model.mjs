import db from "../config/db.mjs";

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
  createWatchList: async (usId, data) => {
    const {
      externalId,
      externalSource = "anilist",
      title,
      imgUrl = null,
      totalEps = 0,
      type = "TV",
      status = "watching",
      tier = null,
      score = null,
      notes = null,
    } = data;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Upsert catalog. Existing rows are NOT overwritten (shared data).
      await conn.execute(
        `INSERT INTO anime_catalog
           (external_id, source, title, cover_image, total_episodes, anim_type)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id = id`,
        [externalId, externalSource, title, imgUrl, totalEps, type],
      );

      const [[catalog]] = await conn.execute(
        "SELECT id, total_episodes FROM anime_catalog WHERE external_id = ? AND source = ?",
        [externalId, externalSource],
      );

      // 2. Business rule: completed + known total => episodes watched = total.
      const episodesWatched =
        status === "completed" && catalog.total_episodes > 0
          ? catalog.total_episodes
          : 0;

      // 3. Per-user row. Duplicate => ER_DUP_ENTRY (controller returns 409).
      const [result] = await conn.execute(
        `INSERT INTO user_anime
           (user_id, anime_id, status, episodes_watched, score, tier, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [usId, catalog.id, status, episodesWatched, score, tier, notes],
      );

      await conn.commit();
      return await Anime.getAnimeById(result.insertId, usId);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },
  // Update detail anime menggunakan Stored Procedure
  updateWatchList: async (animId, usId, data) => {
    const { eps, teps, status, tier, score, notes } = data;

    const current = await Anime.getAnimeById(animId, usId);
    if (!current) return null;

    let epsReal = eps;
    if (status === "completed" && teps > 0) {
      epsReal = teps;
    }

    // Auto-complete uses the total stored in the catalog (same as the old procedure).
    let finalStatus = status;
    const total = current.anim_total_episode;
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
      teps: currentAnime.anim_total_episode ?? 0,
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
