import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import mysql from "mysql2/promise";

const MIGRATIONS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "migrations",
);

export const createConnectionFromEnv = (env = process.env) =>
  mysql.createConnection({
    host: env.MYSQL_HOST,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    port: Number(env.MYSQL_PORT) || 3306,
    multipleStatements: true, // one migration file = many statements
  });

export const runMigrations = async (connection, { log = console.log } = {}) => {
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
    log("No pending migrations.");
  }

  for (const file of pending) {
    log(`Running ${file}...`);
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    await connection.query(sql);
    // Recorded only after success, so a failed file can be re-run safely.
    await connection.query(
      "INSERT INTO schema_migrations (filename) VALUES (?)",
      [file],
    );
    log(`Done ${file}`);
  }
};

// Run as CLI only when executed directly (pnpm migrate), not when imported.
if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  await import("dotenv/config");
  let connection;

  try {
    connection = await createConnectionFromEnv();
    await runMigrations(connection);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}
