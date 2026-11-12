import "dotenv/config";

// Keep in sync with backend/tests/support/env.mjs
const MIN_JWT_SECRET_LENGTH = 16;

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
  // Never print the value itself, only the variable name.
  throw new Error(
    `Konfigurasi tidak valid: variabel JWT_SECRET wajib diisi dan minimal ${MIN_JWT_SECRET_LENGTH} karakter. Periksa file backend/.env.`,
  );
}

const DEFAULT_CORS_ORIGIN = "http://localhost:5173";

const parseCorsOrigins = (raw) => {
  const list = (raw?.trim() ? raw : DEFAULT_CORS_ORIGIN)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (list.length === 0) {
    throw new Error(
      "Konfigurasi tidak valid: CORS_ORIGINS kosong. Contoh: http://localhost:5173",
    );
  }

  return list.map((item) => {
    if (item.includes("*")) {
      throw new Error(
        `Konfigurasi tidak valid: CORS_ORIGINS tidak boleh memakai wildcard (*): "${item}".`,
      );
    }
    let url;
    try {
      url = new URL(item);
    } catch {
      throw new Error(
        `Konfigurasi tidak valid: CORS_ORIGINS berisi origin tidak valid: "${item}". Contoh: http://localhost:5173`,
      );
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(
        `Konfigurasi tidak valid: CORS_ORIGINS harus diawali http:// atau https://: "${item}".`,
      );
    }
    return url.origin; // normalizes trailing slash
  });
};

const parseCookieSecure = (raw, isProduction) => {
  if (raw === undefined || raw.trim() === "") return isProduction;
  const value = raw.trim().toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(
    'Konfigurasi tidak valid: COOKIE_SECURE harus "true" atau "false".',
  );
};

const parseCookieSameSite = (raw, secure) => {
  const value = (raw?.trim() || "lax").toLowerCase();
  if (!["lax", "strict", "none"].includes(value)) {
    throw new Error(
      'Konfigurasi tidak valid: COOKIE_SAMESITE harus "lax", "strict", atau "none".',
    );
  }
  if (value === "none" && !secure) {
    throw new Error(
      "Konfigurasi tidak valid: COOKIE_SAMESITE=none mewajibkan COOKIE_SECURE=true.",
    );
  }
  return value;
};

const nodeEnv = process.env.NODE_ENV || "development";
const cookieSecure = parseCookieSecure(
  process.env.COOKIE_SECURE,
  nodeEnv === "production",
);

const env = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  mysql: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT || 3306,
  },
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  cors: { origins: parseCorsOrigins(process.env.CORS_ORIGINS) },
  cookie: {
    secure: cookieSecure,
    sameSite: parseCookieSameSite(process.env.COOKIE_SAMESITE, cookieSecure),
  },
};

export default env;
