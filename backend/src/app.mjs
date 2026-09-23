import express from "express";
import cors from "cors";
import errorHandler from "./middlewares/error.middleware.mjs";
import AppError from "./utils/appError.mjs";
import authRoutes from "./routes/auth.routes.mjs";
import animRoutes from "./routes/anim.routes.mjs";
// import jikanRoutes from "./routes/jikan.routes.mjs";
import anilistRoutes from "./routes/anilist.routes.mjs";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://187.53.137.199",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS "));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/anime", animRoutes);
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

export default app;
