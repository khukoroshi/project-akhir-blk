import mysql from "mysql2/promise";
import "dotenv/config";

console.log("Menghubungkan ke database pool....");

const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Maksimal 10 koneksi simultan
  queueLimit: 0,
});

// Tes koneksi saat server pertama kali dinyalakan
try {
  const connection = await db.getConnection();
  console.log("Berhasil terhubung ke database MySQL!");
  connection.release(); // Kembalikan koneksi ke pool
} catch (error) {
  console.error("Gagal terhubung ke database:", error.message);
}

export default db;
