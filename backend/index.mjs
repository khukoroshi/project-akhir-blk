// app.mjs is imported last on purpose: tests import app.mjs directly,
// so startup checks live here and nowhere else.

let env;
try {
  ({ default: env } = await import("./src/config/env.mjs"));
} catch (error) {
  console.error(`[STARTUP] ${error.message}`);
  process.exit(1);
}

const { default: db } = await import("./src/config/db.mjs");

const DB_HINTS = {
  ECONNREFUSED: `MySQL tidak bisa dihubungi di ${env.mysql.host}:${env.mysql.port}. Cek: (1) server MySQL sudah menyala, (2) MYSQL_HOST dan MYSQL_PORT di backend/.env benar.`,
  ER_ACCESS_DENIED_ERROR:
    "MySQL menolak login. Cek MYSQL_USER dan MYSQL_PASSWORD di backend/.env, dan pastikan user tersebut punya akses ke database.",
  ER_BAD_DB_ERROR: `Database "${env.mysql.database}" tidak ditemukan. Cek MYSQL_DATABASE di backend/.env, atau buat databasenya (lihat PROGRESS.md: instalasi baru).`,
};

try {
  const connection = await db.getConnection();
  connection.release();
  console.log("Berhasil terhubung ke database MySQL!");
} catch (error) {
  const hint =
    DB_HINTS[error.code] ||
    "Cek konfigurasi MYSQL_* di backend/.env dan status server MySQL.";
  console.error(
    `[STARTUP] Gagal terhubung ke database (${error.code || "UNKNOWN"}).`,
  );
  console.error(`[STARTUP] ${hint}`);
  if (!DB_HINTS[error.code] && error.message) {
    console.error(`[STARTUP] Detail: ${error.message}`);
  }
  process.exit(1);
}

const { default: app } = await import("./src/app.mjs");

app.listen(env.port, () => {
  console.log(`Server is running on http://localhost:${env.port}`);
});
