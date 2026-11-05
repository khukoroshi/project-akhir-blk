import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const MIGRATIONS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "migrations",
);

let connection;

try {
  connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT) || 3306,
    multipleStatements: true, // one migration file = many statements
  });

  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    VARCHAR(255) PRIMARY KEY,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE = InnoDB
  `);

  const [rows] = await connection.query(
    "SELECT filename FROM schema_migrations",
  );
  const executed = new Set(rows.map((row) => row.filename));

  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((file) => /^\d{3}_.+\.sql$/.test(file))
    .sort();
  const pending = files.filter((file) => !executed.has(file));

  if (pending.length === 0) {
    console.log("No pending migrations.");
  }

  for (const file of pending) {
    console.log(`Running ${file}...`);
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    await connection.query(sql);
    // Recorded only after success, so a failed file can be re-run safely.
    await connection.query(
      "INSERT INTO schema_migrations (filename) VALUES (?)",
      [file],
    );
    console.log(`Done ${file}`);
  }
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
}
