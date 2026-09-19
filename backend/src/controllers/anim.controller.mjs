import Anime from "../models/anim.model.mjs";
import AppError from "../utils/appError.mjs";

// 1. Get All Anime milik user yang sedang login
const getAllAnime = async (req, res, next) => {
  try {
    const usId = req.user.id; // Diambil dari JWT Token (middleware protect)
    const anime = await Anime.getAllAnime(usId);

    res.status(200).json({
      status: "success",
      results: anime.length,
      data: anime,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Cari Anime berdasarkan ID Anime
const cariAnimeById = async (req, res, next) => {
  try {
    const usId = req.user.id;
    const animId = req.params.anim_id;

    const anime = await Anime.getAnimeById(animId, usId);
    if (!anime) {
      return next(new AppError("Anime tidak ditemukan di watchlist kamu", 404));
    }

    res.status(200).json({
      status: "success",
      data: anime,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Tambah Anime ke Watchlist
const createWatchList = async (req, res, next) => {
  try {
    const usId = req.user.id;

    const { externalId, title } = req.body;

    if (!externalId) {
      return next(new AppError("externalId anime wajib diisi!", 400));
    }

    if (!title) {
      return next(new AppError("Judul anime (title) wajib diisi!", 400));
    }

    const newAnime = await Anime.createWatchList(usId, req.body);

    res.status(201).json({
      status: "success",
      message: "Anime berhasil ditambahkan ke watchlist",
      data: newAnime,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return next(new AppError("Anime sudah ada dalam watchlist kamu", 409));
    }

    next(error);
  }
};
// 4. Update Detail Anime (Status, Episode, Tier, Score, Notes)
const updateWatchList = async (req, res, next) => {
  try {
    const usId = req.user.id;
    const animId = req.params.anim_id;

    const updatedAnime = await Anime.updateWatchList(animId, usId, req.body);

    if (!updatedAnime) {
      return next(
        new AppError("Data anime tidak ditemukan atau gagal diperbarui", 404),
      );
    }

    res.status(200).json({
      status: "success",
      message: "Watchlist anime berhasil diperbarui",
      data: updatedAnime,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Quick Increment +1 Episode (Tombol cepat tambah 1 eps)
const incrementEpisode = async (req, res, next) => {
  try {
    const usId = req.user.id;
    const animId = req.params.anim_id;

    const updatedAnime = await Anime.incrementEpisode(animId, usId);

    if (!updatedAnime) {
      return next(new AppError("Anime tidak ditemukan", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Episode berhasil bertambah +1",
      data: updatedAnime,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Hapus Anime dari Watchlist
const deleteWatchList = async (req, res, next) => {
  try {
    const usId = req.user.id;
    const animId = req.params.anim_id;

    const affectedRows = await Anime.deleteWatchList(animId, usId);

    if (affectedRows === 0) {
      return next(new AppError("Anime tidak ditemukan di watchlist kamu", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Anime berhasil dihapus dari watchlist",
    });
  } catch (error) {
    next(error);
  }
};

export {
  getAllAnime,
  cariAnimeById,
  createWatchList,
  updateWatchList,
  incrementEpisode,
  deleteWatchList,
};
