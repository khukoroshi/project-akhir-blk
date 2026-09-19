import express from "express";

import {
  searchAnime,
  getAnimeDetail,
  getEpisodes,
} from "../controllers/jikan.controller.mjs";

const router = express.Router();

router.get("/anime", searchAnime);
router.get("/anime/:mal_id", getAnimeDetail);
router.get("/anime/:mal_id/episodes", getEpisodes);

export default router;
