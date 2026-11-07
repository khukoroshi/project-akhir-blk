import db from "../../src/config/db.mjs";
import { assertSafeDatabaseName } from "./env.mjs";

let verified = false;

// DELETE only (no TRUNCATE/DROP). Child tables first because of foreign keys.
export const cleanDatabase = async () => {
  if (!verified) {
    const [[{ name }]] = await db.query("SELECT DATABASE() AS name");
    assertSafeDatabaseName(name);
    verified = true;
  }
  await db.query("DELETE FROM user_anime");
  await db.query("DELETE FROM animes");
  await db.query("DELETE FROM anime_catalog");
  await db.query("DELETE FROM users");
};
