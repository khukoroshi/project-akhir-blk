import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertSafeDatabaseName,
  assertSafeTestEnv,
  readTestEnv,
} from "./support/env.mjs";
import { createConnectionFromEnv, runMigrations } from "../src/db/migrate.mjs";

const BASE_SCHEMA = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "base-schema.sql",
);

const LEGACY_ANIMES_SCHEMA = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "base-legacy-animes.sql",
);

export default async function setup() {
  const env = readTestEnv();
  assertSafeTestEnv(env); // throws BEFORE any database connection

  const connection = await createConnectionFromEnv(env);
  try {
    const [[{ name }]] = await connection.query("SELECT DATABASE() AS name");
    assertSafeDatabaseName(name);

    await connection.query(await fs.readFile(BASE_SCHEMA, "utf8"));

    // animes is only needed for migrations 001/002. After 004 it is
    // animes_legacy, and recreating animes would clash on FK names.
    const [legacy] = await connection.query(
      `SELECT 1 FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'animes_legacy'`,
    );
    if (legacy.length === 0) {
      await connection.query(await fs.readFile(LEGACY_ANIMES_SCHEMA, "utf8"));
    }

    await runMigrations(connection, { log: () => {} });
  } finally {
    await connection.end();
  }
}
