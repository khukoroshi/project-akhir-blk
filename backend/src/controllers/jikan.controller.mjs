import {
  getAnime,
  getAnimeByMalId,
  getAnimeEpisodes,
} from "../services/jikan.service.mjs";

import AppError from "../utils/appError.mjs";

const searchAnime = async (req, res, next) => {
  try {
    const query = req.query.q || "";

    const result = await getAnime(query);

    res.status(200).json({
      status: "success",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(
      new AppError(
        error.message || "Gagal mengambil data dari Jikan",
        error.statusCode || 500,
      ),
    );
  }
};

const getAnimeDetail = async (req, res, next) => {
  try {
    const { mal_id } = req.params;

    const result = await getAnimeByMalId(mal_id);

    res.status(200).json({
      status: "success",
      data: result.data,
    });
  } catch (error) {
    next(
      new AppError(
        error.message || "Gagal mengambil detail anime",
        error.statusCode || 500,
      ),
    );
  }
};

const getEpisodes = async (req, res, next) => {
  try {
    const { mal_id } = req.params;

    const result = await getAnimeEpisodes(mal_id);

    res.status(200).json({
      status: "success",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(
      new AppError(
        error.message || "Gagal mengambil episode anime",
        error.statusCode || 500,
      ),
    );
  }
};

export { searchAnime, getAnimeDetail, getEpisodes };
