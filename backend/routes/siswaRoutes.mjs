import express from "express";
import {
  getAllSiswa,
  // getSiswaById,
  cariSiswaByNama,
  tambahSiswa,
  updateSiswa,
  kickSiswa,
} from "../controllers/siswaController.mjs";

const router = express.Router();

router.get("/", getAllSiswa);
router.get("/:nama", cariSiswaByNama);
router.post("/", tambahSiswa);
router.put("/:id", updateSiswa);
router.delete("/:id", kickSiswa);

export default router;
