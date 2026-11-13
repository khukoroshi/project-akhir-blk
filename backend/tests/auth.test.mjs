import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import db from "../src/config/db.mjs";
import {
  api,
  createUserAndLogin,
  defaultCredentials,
  withSession,
} from "./support/helpers.mjs";

const REGISTER = "/api/auth/register";
const LOGIN = "/api/auth/login";
const PROFILE = "/api/auth/profile";

const expectError = (res, status) => {
  expect(res.status).toBe(status);
  expect(res.body.status).toBe("error");
  expect(typeof res.body.message).toBe("string");
};

const countUsers = async () => {
  const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM users");
  return total;
};

describe("POST /api/auth/register", () => {
  it("201: membuat user dan tidak membocorkan password", async () => {
    const res = await api().post(REGISTER).send(defaultCredentials);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toMatchObject({
      us_name: defaultCredentials.name,
      us_email: defaultCredentials.email,
      us_id: expect.any(Number),
    });
    expect(res.body.data).not.toHaveProperty("us_password");
    expect(JSON.stringify(res.body)).not.toContain(defaultCredentials.password);
  });

  it("menyimpan password sebagai hash bcrypt", async () => {
    await api().post(REGISTER).send(defaultCredentials);

    const [[row]] = await db.query(
      "SELECT us_password FROM users WHERE us_email = ?",
      [defaultCredentials.email],
    );
    expect(row.us_password).not.toBe(defaultCredentials.password);
    expect(row.us_password).toMatch(/^\$2[aby]\$/);
  });

  it("menyimpan email dalam huruf kecil", async () => {
    const res = await api()
      .post(REGISTER)
      .send({ ...defaultCredentials, email: "Tester@Example.COM" });

    expect(res.status).toBe(201);
    expect(res.body.data.us_email).toBe("tester@example.com");
  });

  it.each([
    ["email tanpa format valid", { email: "bukan-email" }],
    ["password 7 karakter", { password: "Abcde12" }],
    ["password tanpa angka", { password: "Abcdefgh" }],
    ["password tanpa huruf", { password: "12345678" }],
    ["password lebih dari 72 karakter", { password: `A1${"x".repeat(71)}` }],
    ["nama kurang dari 3 karakter", { name: "ab" }],
    ["password tidak dikirim", { password: undefined }],
  ])("400: %s", async (_label, override) => {
    const res = await api()
      .post(REGISTER)
      .send({ ...defaultCredentials, ...override });

    expectError(res, 400);
    expect(await countUsers()).toBe(0);
  });

  it.each([
    ["role", { role: "admin" }],
    ["confirmPassword", { confirmPassword: "Password123" }],
  ])("400: field asing ditolak (%s)", async (_label, extra) => {
    const res = await api()
      .post(REGISTER)
      .send({ ...defaultCredentials, ...extra });

    expectError(res, 400);
    expect(await countUsers()).toBe(0);
  });

  it("400 'Nama sudah digunakan' untuk nama duplikat", async () => {
    await api().post(REGISTER).send(defaultCredentials);

    const res = await api()
      .post(REGISTER)
      .send({ ...defaultCredentials, email: "lain@example.com" });

    expectError(res, 400);
    expect(res.body.message).toBe("Nama sudah digunakan");
  });

  it("400 'Email sudah digunakan' untuk email duplikat", async () => {
    await api().post(REGISTER).send(defaultCredentials);

    const res = await api()
      .post(REGISTER)
      .send({ ...defaultCredentials, name: "penguji-lain" });

    expectError(res, 400);
    expect(res.body.message).toBe("Email sudah digunakan");
  });
});

describe("POST /api/auth/login", () => {
  const registerFirst = () => api().post(REGISTER).send(defaultCredentials);

  it("200: mengembalikan user saja, token tidak ada di body", async () => {
    await registerFirst();

    const res = await api().post(LOGIN).send({
      email: defaultCredentials.email,
      password: defaultCredentials.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Object.keys(res.body.data)).toEqual(["user"]);
    expect(res.body.data.user).toMatchObject({
      id: expect.any(Number),
      name: defaultCredentials.name,
      email: defaultCredentials.email,
    });
    expect(JSON.stringify(res.body)).not.toMatch(/eyJ/); // no JWT anywhere
  });

  it("200: email tidak peka huruf besar/kecil", async () => {
    await registerFirst();

    const res = await api().post(LOGIN).send({
      email: "TESTER@EXAMPLE.COM",
      password: defaultCredentials.password,
    });

    expect(res.status).toBe(200);
  });

  it("401: password salah", async () => {
    await registerFirst();

    const res = await api()
      .post(LOGIN)
      .send({ email: defaultCredentials.email, password: "SalahBanget1" });

    expectError(res, 401);
  });

  it("401: email tidak terdaftar, pesan sama dengan password salah", async () => {
    await registerFirst();

    const wrongPassword = await api()
      .post(LOGIN)
      .send({ email: defaultCredentials.email, password: "SalahBanget1" });
    const unknownEmail = await api()
      .post(LOGIN)
      .send({ email: "tidakada@example.com", password: "Password123" });

    expectError(unknownEmail, 401);
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it.each([
    ["email tidak valid", { email: "bukan-email", password: "Password123" }],
    ["password tidak dikirim", { email: "tester@example.com" }],
    [
      "field asing",
      { email: "tester@example.com", password: "Password123", role: "admin" },
    ],
  ])("400: %s", async (_label, body) => {
    const res = await api().post(LOGIN).send(body);
    expectError(res, 400);
  });
});

describe("GET /api/auth/profile", () => {
  it("200: token valid mengembalikan isi payload JWT", async () => {
    const { user, token } = await createUserAndLogin();

    const res = await withSession(api().get(PROFILE), token);

    expect(res.status).toBe(200);
    expect(res.body.data.userInfo).toMatchObject({
      id: user.id,
      name: user.name,
      email: user.email,
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
  });

  it("401: tanpa token", async () => {
    const res = await api().get(PROFILE);
    expectError(res, 401);
  });

  it.each([
    ["cookie rusak", "bukan.token.valid"],
    ["cookie kosong", ""],
  ])("401: %s", async (_label, value) => {
    const res = await api().get(PROFILE).set("Cookie", `access_token=${value}`);
    expectError(res, 401);
  });

  it("401: token ditandatangani secret lain", async () => {
    const forged = jwt.sign(
      { id: 1, name: "x", email: "x@example.com" },
      "secret-orang-lain",
    );
    const res = await withSession(api().get(PROFILE), forged); // dan: expired
    expectError(res, 401);
  });

  it("401: token kedaluwarsa", async () => {
    const expired = jwt.sign(
      { id: 1, name: "x", email: "x@example.com" },
      process.env.JWT_SECRET,
      { expiresIn: -10 },
    );
    const res = await withSession(api().get(PROFILE), expired);
    expectError(res, 401);
  });
});
