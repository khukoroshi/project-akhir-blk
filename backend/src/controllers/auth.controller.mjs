import * as authService from "../services/auth.service.mjs";
import { setAuthCookies, clearAuthCookies } from "../utils/authCookies.mjs";

// Controller untuk Register
export const register = async (req, res, next) => {
  try {
    const newUser = await authService.registerUser(req.body);

    // Respon sukses ke frontend
    res.status(201).json({
      status: "success",
      message: "Register berhasil",
      data: newUser,
    });
  } catch (error) {
    next(error); // Lempar error ke Global Error Handler
  }
};

// Controller untuk Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);
    setAuthCookies(res, result.token);

    res.status(200).json({
      status: "success",
      message: "Login berhasil",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Controller untuk Get Profile
export const getProfile = (req, res) => {
  // Objek req.user didapat dari middleware auth/protect
  res.status(200).json({
    status: "success",
    message: "Berhasil mengambil profil user",
    data: {
      userInfo: req.user,
    },
  });
};

// Controller untuk Logout (tanpa input, jadi tanpa schema Zod)
export const logout = (req, res) => {
  clearAuthCookies(res);
  res.status(200).json({ status: "success", message: "Logout berhasil" });
};
