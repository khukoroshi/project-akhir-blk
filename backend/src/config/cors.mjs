import cors from "cors";
import env from "./env.mjs";

// An origin that is not in the list gets no Access-Control-Allow-Origin header.
const corsMiddleware = cors({
  origin: env.cors.origins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  maxAge: 600,
});

export default corsMiddleware;
