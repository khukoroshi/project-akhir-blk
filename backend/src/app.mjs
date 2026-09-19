import express from "express";
import cors from "cors";
import errorHandler from "./middlewares/error.middleware.mjs";
import AppError from "./utils/appError.mjs";
import authRoutes from "./routes/auth.routes.mjs";
import animRoutes from "./routes/anim.routes.mjs";
import jikanRoutes from "./routes/jikan.routes.mjs";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/anime", animRoutes);
app.use("/api/catalog", jikanRoutes);

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

export default app;
