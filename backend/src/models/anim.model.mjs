import db from "../config/db.mjs";

const Anime = {
  // Ambil semua watchlist milik user tertentu
  getAllAnime: async (usId) => {
    const query = "SELECT * FROM animes WHERE us_id = ? ORDER BY anim_id DESC";
    const [rows] = await db.execute(query, [usId]);
    return rows;
  },

  // Ambil detail 1 anime berdasarkan ID & us_id
  getAnimeById: async (animId, usId) => {
    const query = "SELECT * FROM animes WHERE anim_id = ? AND us_id = ?";
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

    const query = "CALL sp_insert_anime(?,?,?,?,?,?,?,?,?,?,?)";

    const [result] = await db.execute(query, [
      usId,
      externalId,
      externalSource,
      title,
      imgUrl,
      totalEps,
      type,
      status,
      tier,
      score,
      notes,
    ]);

    return result[0][0];
  },
  // Update detail anime menggunakan Stored Procedure
  updateWatchList: async (animId, usId, data) => {
    const { eps, status, tier, score, notes } = data;

    const query = "CALL sp_update_anime(?, ?, ?, ?, ?, ?, ?)";
    const [result] = await db.execute(query, [
      animId,
      usId,
      eps,
      status,
      tier,
      score,
      notes,
    ]);

    return result[0][0] || null;
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
      status: currentAnime.anim_status,
      tier: currentAnime.anim_tier,
      score: currentAnime.anim_score,
      notes: currentAnime.anim_personal_notes,
    });
  },

  // Hapus anime dari watchlist
  deleteWatchList: async (animId, usId) => {
    const query = "DELETE FROM animes WHERE anim_id = ? AND us_id = ?";
    const [result] = await db.execute(query, [animId, usId]);
    return result.affectedRows;
  },
};

export default Anime;
