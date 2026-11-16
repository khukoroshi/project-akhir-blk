import { afterAll, describe, expect, it } from "vitest";
import db from "../src/config/db.mjs";
import { createConnectionFromEnv, runMigrations } from "../src/db/migrate.mjs";
import { assertSafeDatabaseName } from "./support/env.mjs";

const tableExists = async (name) => {
  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [name],
  );
  return rows.length === 1;
};

const procedureExists = async (name) => {
  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.ROUTINES
     WHERE ROUTINE_SCHEMA = DATABASE()
       AND ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_NAME = ?`,
    [name],
  );
  return rows.length === 1;
};

const expectRetiredState = async () => {
  expect(await tableExists("animes_legacy")).toBe(true);
  expect(await tableExists("animes")).toBe(false);
  expect(await procedureExists("sp_insert_anime")).toBe(false);
  expect(await procedureExists("sp_update_anime")).toBe(false);
  expect(await procedureExists("sp_insert_user")).toBe(true);
};

describe("migration 004 (retire legacy animes)", () => {
  let connection;

  afterAll(async () => {
    if (connection) await connection.end();
  });

  it("leaves animes_legacy, no animes, and only sp_insert_user", async () => {
    await expectRetiredState();
  });

  it("running migrations again does not error or change state", async () => {
    connection = await createConnectionFromEnv();
    const [[{ name }]] = await connection.query("SELECT DATABASE() AS name");
    assertSafeDatabaseName(name);

    await expect(
      runMigrations(connection, { log: () => {} }),
    ).resolves.not.toThrow();
    await expectRetiredState();
  });

  it("file 004 itself is idempotent when forced to run again", async () => {
    connection ??= await createConnectionFromEnv();
    const [[{ name }]] = await connection.query("SELECT DATABASE() AS name");
    assertSafeDatabaseName(name);

    await connection.query(
      "DELETE FROM schema_migrations WHERE filename LIKE '004_%'",
    );
    await expect(
      runMigrations(connection, { log: () => {} }),
    ).resolves.not.toThrow();
    await expectRetiredState();
  });
});
