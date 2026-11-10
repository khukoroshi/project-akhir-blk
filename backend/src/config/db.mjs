import mysql from "mysql2/promise";
import env from "./env.mjs";

const db = mysql.createPool({
  host: env.mysql.host,
  user: env.mysql.user,
  password: env.mysql.password,
  database: env.mysql.database,
  port: env.mysql.port,
  waitForConnections: true,
  connectionLimit: 10, // Maksimal 10 koneksi simultan
  queueLimit: 0,
  decimalNumbers: true, // DECIMAL columns (user_anime.score) come back as number, not "8.0"
});

export default db;
