import mysql from "mysql2/promise";
import "dotenv/config";

console.log("Menghubungkan ke database....");

const db = await mysql.createConnection({
  host: "localhost",
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: "sekolah_db",
});
console.log("Berhasil terhubung ke database.");
export default db;
