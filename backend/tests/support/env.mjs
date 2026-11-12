import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const ENV_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.env.test",
);

const REQUIRED_KEYS = [
  "MYSQL_HOST",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "MYSQL_DATABASE",
  "JWT_SECRET",
  "CORS_ORIGINS",
  "COOKIE_SECURE",
  "COOKIE_SAMESITE",
];

// Keep in sync with backend/src/config/env.mjs
const MIN_JWT_SECRET_LENGTH = 16;

export const readTestEnv = () => {
  if (!fs.existsSync(ENV_FILE)) {
    throw new Error(
      "backend/.env.test tidak ditemukan. Salin dari .env.test.example lalu isi.",
    );
  }
  return dotenv.parse(fs.readFileSync(ENV_FILE));
};

export const assertSafeDatabaseName = (name) => {
  if (typeof name !== "string" || !name.endsWith("_test")) {
    throw new Error(
      `TES DIHENTIKAN: nama database "${name}" tidak berakhiran "_test". ` +
        "Tes hanya boleh berjalan di database test.",
    );
  }
};

// Every key must come from .env.test. A missing key would otherwise be
// filled from the real .env by dotenv/config in db.mjs.
export const assertSafeTestEnv = (env) => {
  const missing = REQUIRED_KEYS.filter(
    (key) =>
      env[key] === undefined || (key !== "MYSQL_PASSWORD" && env[key] === ""),
  );
  if (missing.length > 0) {
    throw new Error(`TES DIHENTIKAN: .env.test kurang: ${missing.join(", ")}`);
  }
  if (env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `TES DIHENTIKAN: JWT_SECRET di .env.test minimal ${MIN_JWT_SECRET_LENGTH} karakter.`,
    );
  }
  if (env.COOKIE_SECURE !== "false" || env.COOKIE_SAMESITE !== "lax") {
    throw new Error(
      "TES DIHENTIKAN: .env.test harus COOKIE_SECURE=false dan COOKIE_SAMESITE=lax.",
    );
  }
  assertSafeDatabaseName(env.MYSQL_DATABASE);
};
