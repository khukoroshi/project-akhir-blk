import "./support/guard.mjs"; // must stay the FIRST import
import { afterAll, beforeEach, vi } from "vitest";
import db from "../src/config/db.mjs";
import { cleanDatabase } from "./support/db.mjs";

// Any fetch (AniList) in a test is a bug, so fail loudly.
vi.stubGlobal(
  "fetch",
  vi.fn(async () => {
    throw new Error("Tes tidak boleh memanggil jaringan (fetch).");
  }),
);

beforeEach(cleanDatabase);
afterAll(() => db.end());
