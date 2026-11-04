import express from "express";
import * as authController from "../controllers/auth.controller.mjs";
import { protect } from "../middlewares/auth.middleware.mjs";
import { validate } from "../middlewares/validate.middleware.mjs";
import { registerSchema, loginSchema } from "../validators/auth.validator.mjs";

const router = express.Router();

// Route untuk Registrasi User
router.post("/register", validate(registerSchema), authController.register);

// Route untuk Login User
router.post("/login", validate(loginSchema), authController.login);

// Route Terproteksi untuk Mengambil Profil User
router.get("/profile", protect, authController.getProfile);

export default router;
