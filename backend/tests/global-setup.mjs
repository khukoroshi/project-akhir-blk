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

export default async function setup() {
  const env = readTestEnv();
  assertSafeTestEnv(env); // throws BEFORE any database connection

  const connection = await createConnectionFromEnv(env);
  try {
    const [[{ name }]] = await connection.query("SELECT DATABASE() AS name");
    assertSafeDatabaseName(name);

    await connection.query(await fs.readFile(BASE_SCHEMA, "utf8"));
    await runMigrations(connection, { log: () => {} });
  } finally {
    await connection.end();
  }
}
