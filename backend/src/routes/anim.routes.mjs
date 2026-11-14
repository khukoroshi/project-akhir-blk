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
import { validate } from "../middlewares/validate.middleware.mjs";
import {
  animIdParamSchema,
  createAnimeSchema,
  updateAnimeSchema,
} from "../validators/anim.validator.mjs";

export const createAnimRoutes = ({ createAnime }) => {
  const router = express.Router();
  const validateAnimId = validate(animIdParamSchema, "params");

  router.use(protect);

  router.get("/", getAllAnime);
  router.get("/:anim_id", validateAnimId, cariAnimeById);
  router.post("/", createAnime, validate(createAnimeSchema), createWatchList); // <- createAnime ditambah
  // put, patch, delete: tidak berubah
  router.put(
    "/:anim_id",
    validateAnimId,
    validate(updateAnimeSchema),
    updateWatchList,
  );
  router.patch("/:anim_id/increment", validateAnimId, incrementEpisode);
  router.delete("/:anim_id", validateAnimId, deleteWatchList);

  return router;
};
