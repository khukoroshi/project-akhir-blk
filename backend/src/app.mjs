import express from "express";
import cookieParser from "cookie-parser";
import env from "./config/env.mjs";
import corsMiddleware from "./config/cors.mjs";
import { createRateLimiters } from "./config/rateLimit.mjs";
import errorHandler from "./middlewares/error.middleware.mjs";
import AppError from "./utils/appError.mjs";
import authRoutes from "./routes/auth.routes.mjs";
import { createAnimRoutes } from "./routes/anim.routes.mjs";
import anilistRoutes from "./routes/anilist.routes.mjs";

export const createApp = ({
  rateLimit = env.rateLimit,
  trustProxy = env.trustProxy,
} = {}) => {
  const app = express();
  if (trustProxy !== undefined) app.set("trust proxy", trustProxy);

  const limiters = createRateLimiters(rateLimit);

  app.use(corsMiddleware);
  app.use("/api", limiters.global);
  app.use(cookieParser());
  app.use(express.json());

  // Route-specific limiters run before validation and bcrypt.
  // Without a final handler, they simply call next() to the routers below.
  app.post("/api/auth/login", limiters.loginEmail, limiters.loginIp);
  app.post("/api/auth/register", limiters.register);
  app.use("/api/catalog", limiters.catalog);

  app.use("/api/auth", authRoutes);
  app.use("/api/anime", createAnimRoutes(limiters));
  app.use("/api/catalog", anilistRoutes);

  // Endpoint utama
  app.get("/", (req, res) => {
    res.send("Hello World! Server Express AniWatchlist berhasil berjalan.");
  });

  // handler 404
  app.use((req, res, next) => {
    next(new AppError(`Route ${req.originalUrl} tidak ditemukan`, 404));
  });

  // global handler error
  app.use(errorHandler);

  return app;
};

export default createApp();
