import express from "express";

import { searchAnime, getDetail, getFeatured } from "./anime.controller.mjs";
import { validate } from "../../middlewares/validate.middleware.mjs";
import { catalogQuerySchema, featuredQuerySchema } from "./anime.validator.mjs";

const router = express.Router();

router.get("/anime", validate(catalogQuerySchema, "query"), searchAnime);
// Must stay above "/anime/:id", otherwise "featured" would be read as an id.
router.get(
  "/anime/featured",
  validate(featuredQuerySchema, "query"),
  getFeatured,
);
router.get("/anime/:id", getDetail);

export default router;
