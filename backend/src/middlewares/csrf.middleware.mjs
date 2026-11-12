import crypto from "node:crypto";
import AppError from "../utils/appError.mjs";
import { CSRF_COOKIE } from "../utils/authCookies.mjs";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Hash first so timingSafeEqual always gets equal-length buffers.
const safeEqual = (a, b) =>
  crypto.timingSafeEqual(
    crypto.createHash("sha256").update(a).digest(),
    crypto.createHash("sha256").update(b).digest(),
  );

// Double-submit check: header X-CSRF-Token must equal the csrf_token cookie.
// Called by `protect` only when the session comes from the cookie.
export const csrfProtect = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get("x-csrf-token");

  if (
    typeof cookieToken !== "string" ||
    cookieToken === "" ||
    typeof headerToken !== "string" ||
    !safeEqual(cookieToken, headerToken)
  ) {
    return next(new AppError("Token CSRF tidak valid", 403));
  }
  next();
};
