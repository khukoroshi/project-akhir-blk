import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import AppError from "../utils/appError.mjs";

const passThrough = (req, res, next) => next();

export const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase().slice(0, 100) : "";

// Key: IP + email. Runs before validation, so the body can be anything.
export const loginEmailKey = (req) =>
  `${ipKeyGenerator(req.ip ?? "unknown")}|${normalizeEmail(req.body?.email)}`;

// Key: user id from the session (the limiter must run after `protect`).
// Falls back to the IP if no user is attached.
export const userKey = (req) => {
  const id = req.user?.id;
  return id !== undefined ? `user:${id}` : ipKeyGenerator(req.ip ?? "unknown");
};

export const createLimiter = ({
  windowMs,
  limit,
  enabled = true,
  keyGenerator,
  skipSuccessfulRequests = false,
  subject = "permintaan",
}) => {
  if (!enabled) return passThrough;

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: (req, res, next, options) => {
      const resetTime = req.rateLimit?.resetTime;
      const seconds = Math.max(
        1,
        Math.ceil(
          (resetTime ? resetTime.getTime() - Date.now() : options.windowMs) /
            1000,
        ),
      );
      const minutes = Math.ceil(seconds / 60);
      res.set("Retry-After", String(seconds));
      next(
        new AppError(
          `Terlalu banyak ${subject}. Coba lagi dalam ${minutes} menit.`,
          429,
        ),
      );
    },
  });
};

// config = { enabled, limits: { name: { limit, windowMs } } }
// Every call creates NEW limiters with their own memory store.
export const createRateLimiters = ({ enabled, limits }) => {
  const make = (name, options = {}) =>
    createLimiter({ enabled, ...limits[name], ...options });

  return {
    global: make("global"),
    loginEmail: make("loginEmail", {
      skipSuccessfulRequests: true,
      keyGenerator: loginEmailKey,
      subject: "percobaan login",
    }),
    loginIp: make("loginIp", {
      skipSuccessfulRequests: true,
      subject: "percobaan login",
    }),
    register: make("register", { subject: "percobaan pendaftaran" }),
    catalog: make("catalog"),
    createAnime: make("createAnime", {
      keyGenerator: userKey,
      subject: "penambahan anime",
    }),
  };
};
