import {
  getAnime,
  getAnimeDetail,
  getFeaturedAnime,
} from "../../integrations/anilist/index.mjs";

import AppError from "../../utils/appError.mjs";

const searchAnime = async (req, res, next) => {
  try {
    const query = req.query.q || "";
    const page = Number(req.query.page) || 1; // already validated by Zod
    const filter = req.query.filter || "all"; // ignored by service if q exists

    const { items, meta } = await getAnime(query, page, filter);

    res.status(200).json({
      status: "success",
      data: items,
      meta,
    });
  } catch (error) {
    next(
      new AppError(
        error.message || "Could not fetch data from AniList",
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
        error.message || "Could not fetch anime details from AniList",
        error.statusCode || 500,
      ),
    );
  }
};

const getFeatured = async (req, res, next) => {
  try {
    const items = await getFeaturedAnime();

    res.status(200).json({ status: "success", data: items });
  } catch (error) {
    next(
      new AppError(
        error.message || "Could not fetch featured anime from AniList",
        error.statusCode || 500,
      ),
    );
  }
};

export { searchAnime, getDetail, getFeatured };
