import jwt from "jsonwebtoken";
import AppError from "../utils/appError.mjs";
import env from "../config/env.mjs";
import { ACCESS_COOKIE } from "../utils/authCookies.mjs";
import { csrfProtect } from "./csrf.middleware.mjs";

// If an Authorization header exists it wins (no cookie fallback).
const resolveToken = (req) => {
  const header = req.headers.authorization;
  if (header) {
    const [scheme, value] = header.split(" ");
    return { token: scheme === "Bearer" ? value : undefined, source: "bearer" };
  }
  return { token: req.cookies?.[ACCESS_COOKIE], source: "cookie" };
};

export const protect = (req, res, next) => {
  const { token, source } = resolveToken(req);

  if (!token) {
    return next(
      new AppError("Anda belum login. Silakan bawa token Anda.", 401),
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

  // Bearer is not sent automatically by browsers, so only cookies need CSRF.
  if (source === "cookie") return csrfProtect(req, res, next);
  next();
};
