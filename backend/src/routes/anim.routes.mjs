import express from "express";
import {
  getAllAnime,
  cariAnimeById,
  createWatchList,
  updateWatchList,
  incrementEpisode,
  deleteWatchList,
} from "../controllers/anim.controller.mjs";
import { protect } from "../middlewares/auth.middleware.mjs";

const router = express.Router();

router.use(protect);
router.get("/", getAllAnime);
router.get("/:anim_id", cariAnimeById);
router.post("/", createWatchList);
router.put("/:anim_id", updateWatchList);
router.patch("/:anim_id/increment", incrementEpisode);
router.delete("/:anim_id", deleteWatchList);

export default router;
