import Anime from "./watchlist.model.mjs";
import AppError from "../../utils/appError.mjs";

const NOT_IN_LIST = "Anime not found in your list";

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
      return next(new AppError(NOT_IN_LIST, 404));
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

    const newAnime = await Anime.createWatchList(usId, req.body);

    res.status(201).json({
      status: "success",
      message: "Anime added to your list",
      data: newAnime,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return next(new AppError("This anime is already in your list", 409));
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
      return next(new AppError("Anime not found or could not be updated", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Anime updated successfully",
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
      return next(new AppError("Anime not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Episode count increased by 1",
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
      return next(new AppError(NOT_IN_LIST, 404));
    }

    res.status(200).json({
      status: "success",
      message: "Anime removed from your list",
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
