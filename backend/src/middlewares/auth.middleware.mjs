import jwt from "jsonwebtoken";
import AppError from "../utils/appError.mjs";
import env from "../config/env.mjs";
import { ACCESS_COOKIE } from "../utils/authCookies.mjs";
import { csrfProtect } from "./csrf.middleware.mjs";

// Session comes only from the HttpOnly cookie. Other credentials are never read.
export const protect = (req, res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE];

  if (!token) {
    return next(
      new AppError("Anda belum login. Silakan login terlebih dahulu.", 401),
    );
  }

  try {
    req.user = jwt.verify(token, env.jwt.secret);
  } catch (error) {
    return next(
      new AppError(
        "Token tidak valid atau sudah kadaluarsa. Silahkan login lagi",
        401,
      ),
    );
  }

  // Every authenticated request uses the cookie, so every mutation needs CSRF.
  return csrfProtect(req, res, next);
};
