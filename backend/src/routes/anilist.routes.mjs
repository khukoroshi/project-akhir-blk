import express from "express";

import { searchAnime, getDetail } from "../controllers/anilist.controller.mjs";

const router = express.Router();

router.get("/anime", searchAnime);
router.get("/anime/:id", getDetail);

export default router;
