import { assertSafeTestEnv } from "./env.mjs";

// Second safety net: runs inside every test worker, before the app is imported.
assertSafeTestEnv(process.env);
