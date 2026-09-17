import express from "express";
import * as authController from "../controllers/auth.controller.mjs";
import { protect } from "../middlewares/auth.middleware.mjs";

const router = express.Router();

// Route untuk Registrasi User
router.post("/register", authController.register);

// Route untuk Login User
router.post("/login", authController.login);

// Route Terproteksi untuk Mengambil Profil User
router.get("/profile", protect, authController.getProfile);

export default router;
