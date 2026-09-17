import express from "express";
import "dotenv/config";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import siswaRoutes from "./routes/siswaRoutes.mjs";

const PORT = process.env.PORT || 3000;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// konfigurasi khusus
// const corsOption = {
//   origin:'http://localhost:3000',
//   methods: 'GET,POST',
//   optionsSuccessStatus: 200
// }
// app.use(cors(corsOption))

// middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/siswa", siswaRoutes);

app.get("/", (req, res) => {
  res.status(200).send("Selamat Datang di Sistem Informasi Registrasi Siswa");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
