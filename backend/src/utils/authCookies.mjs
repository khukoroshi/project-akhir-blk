import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import env from "../config/env.mjs";

export const ACCESS_COOKIE = "access_token";
export const CSRF_COOKIE = "csrf_token";

const baseOptions = () => ({
  path: "/",
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
});

export const setAuthCookies = (res, token) => {
  // Max-Age follows the JWT lifetime (exp - iat), so no JWT_EXPIRES_IN parsing.
  const { iat, exp } = jwt.decode(token) ?? {};
  const maxAge = iat && exp ? (exp - iat) * 1000 : undefined;

  res.cookie(ACCESS_COOKIE, token, {
    ...baseOptions(),
    httpOnly: true,
    maxAge,
  });
  res.cookie(CSRF_COOKIE, crypto.randomBytes(32).toString("hex"), {
    ...baseOptions(),
    httpOnly: false, // the frontend must read it
    maxAge,
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions(), httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...baseOptions(), httpOnly: false });
};
