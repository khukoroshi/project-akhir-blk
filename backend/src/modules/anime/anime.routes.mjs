import express from "express";

import { searchAnime, getDetail } from "./anime.controller.mjs";
import { validate } from "../../middlewares/validate.middleware.mjs";
import { catalogQuerySchema } from "./anime.validator.mjs";

const router = express.Router();

router.get("/anime", validate(catalogQuerySchema, "query"), searchAnime);
router.get("/anime/:id", getDetail);

export default router;
