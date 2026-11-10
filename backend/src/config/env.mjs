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
};

export default env;
