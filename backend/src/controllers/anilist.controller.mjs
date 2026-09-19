import { getAnime, getAnimeDetail } from "../services/anilist.service.mjs";

import AppError from "../utils/appError.mjs";

const searchAnime = async (req, res, next) => {
  try {
    const query = req.query.q || "";

    const result = await getAnime(query);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(
      new AppError(
        error.message || "Gagal mengambil data dari AniList",
        error.statusCode || 500,
      ),
    );
  }
};

const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await getAnimeDetail(id);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(
      new AppError(
        error.message || "Gagal mengambil detail anime dari AniList",
        error.statusCode || 500,
      ),
    );
  }
};

export { searchAnime, getDetail };
