import { defineConfig } from "vitest/config";
import { readTestEnv } from "./tests/support/env.mjs";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.mjs"],
    globalSetup: ["./tests/global-setup.mjs"],
    setupFiles: ["./tests/setup.mjs"],
    // All files share one test database, so files must not run in parallel.
    fileParallelism: false,
    testTimeout: 15000,
    // Values from .env.test override anything in .env (dotenv never overrides).
    env: { ...readTestEnv(), NODE_ENV: "test" },
  },
});
