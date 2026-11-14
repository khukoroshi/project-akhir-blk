import { describe, expect, it } from "vitest";
import request from "supertest";
import env from "../src/config/env.mjs";
import { createApp } from "../src/app.mjs";
import { createUserAndLogin, withSession } from "./support/helpers.mjs";

const LOGIN = "/api/auth/login";
const REGISTER = "/api/auth/register";

const limit = (max, windowMin = 15) => ({
  limit: max,
  windowMs: windowMin * 60 * 1000,
});

// Fresh app = fresh limiter stores, so every test starts from zero.
const buildApp = ({ limits = {}, trustProxy, enabled = true } = {}) =>
  request(
    createApp({
      trustProxy,
      rateLimit: {
        enabled,
        limits: {
          global: limit(1000),
          loginEmail: limit(1000),
          loginIp: limit(1000),
          register: limit(1000),
          catalog: limit(1000),
          createAnime: limit(1000),
          ...limits,
        },
      },
    }),
  );

const expectLimited = (res) => {
  expect(res.status).toBe(429);
  expect(res.body.status).toBe("error");
  expect(res.body.message).toMatch(/menit/);
  expect(Number(res.headers["retry-after"])).toBeGreaterThan(0);
  expect(res.headers["ratelimit-limit"]).toBeDefined();
  expect(res.headers["x-ratelimit-limit"]).toBeUndefined();
};

const wrongLogin = (server, email, ip) => {
  const req = server.post(LOGIN).send({ email, password: "SalahBanget1" });
  return ip ? req.set("X-Forwarded-For", ip) : req;
};

it("rate limiting is off by default in the test environment", () => {
  expect(env.rateLimit.enabled).toBe(false);
});

describe("login: per IP + email", () => {
  it("429 on the 6th failed attempt, with Retry-After", async () => {
    const { credentials } = await createUserAndLogin();
    const server = buildApp({ limits: { loginEmail: limit(5) } });

    for (let i = 0; i < 5; i++) {
      expect((await wrongLogin(server, credentials.email)).status).toBe(401);
    }
    expectLimited(await wrongLogin(server, credentials.email));
  });

  it("blocks before bcrypt: even the correct password gets 429", async () => {
    const { credentials } = await createUserAndLogin();
    const server = buildApp({ limits: { loginEmail: limit(2) } });

    await wrongLogin(server, credentials.email);
    await wrongLogin(server, credentials.email);

    const res = await server
      .post(LOGIN)
      .send({ email: credentials.email, password: credentials.password });
    expectLimited(res);
  });

  it("normalizes the email (case and spaces count as the same key)", async () => {
    const { credentials } = await createUserAndLogin();
    const server = buildApp({ limits: { loginEmail: limit(5) } });

    for (let i = 0; i < 3; i++) await wrongLogin(server, credentials.email);
    for (let i = 0; i < 2; i++) {
      await wrongLogin(server, `  ${credentials.email.toUpperCase()} `);
    }
    expectLimited(await wrongLogin(server, credentials.email));
  });

  it("successful logins are not counted", async () => {
    const { credentials } = await createUserAndLogin();
    const server = buildApp({ limits: { loginEmail: limit(5) } });

    for (let i = 0; i < 3; i++) await wrongLogin(server, credentials.email);
    for (let i = 0; i < 7; i++) {
      const ok = await server
        .post(LOGIN)
        .send({ email: credentials.email, password: credentials.password });
      expect(ok.status).toBe(200);
    }
    // 3 failures so far: 2 more are allowed, the next one is blocked.
    expect((await wrongLogin(server, credentials.email)).status).toBe(401);
    expect((await wrongLogin(server, credentials.email)).status).toBe(401);
    expectLimited(await wrongLogin(server, credentials.email));
  });

  it("a different email from the same IP is not locked", async () => {
    const { credentials } = await createUserAndLogin();
    const server = buildApp({ limits: { loginEmail: limit(5) } });

    for (let i = 0; i < 5; i++) await wrongLogin(server, credentials.email);
    expectLimited(await wrongLogin(server, credentials.email));

    const other = await wrongLogin(server, "orang-lain@example.com");
    expect(other.status).toBe(401);
  });
});

describe("login: per IP", () => {
  it("counts failures per IP across different emails", async () => {
    const server = buildApp({
      trustProxy: 1,
      limits: { loginIp: limit(3) },
    });

    for (let i = 0; i < 3; i++) {
      const res = await wrongLogin(server, `u${i}@example.com`, "203.0.113.1");
      expect(res.status).toBe(401);
    }
    expectLimited(await wrongLogin(server, "u9@example.com", "203.0.113.1"));

    const otherIp = await wrongLogin(server, "u9@example.com", "203.0.113.2");
    expect(otherIp.status).toBe(401);
  });
});

describe("register", () => {
  it("429 after the limit, counted per IP", async () => {
    const server = buildApp({ limits: { register: limit(2, 60) } });

    expect((await server.post(REGISTER).send({})).status).toBe(400);
    expect((await server.post(REGISTER).send({})).status).toBe(400);
    expectLimited(await server.post(REGISTER).send({}));
  });
});

describe("catalog", () => {
  it("limit is shared by the list and detail endpoints", async () => {
    const server = buildApp({ limits: { catalog: limit(2, 1) } });

    expect((await server.get("/api/catalog/anime?page=0")).status).toBe(400);
    expect((await server.get("/api/catalog/anime/abc")).status).toBe(400);
    expectLimited(await server.get("/api/catalog/anime?page=0"));
  });
});

describe("POST /api/anime", () => {
  it("is counted per user, not per IP", async () => {
    const a = await createUserAndLogin();
    const b = await createUserAndLogin({
      name: "tester-b",
      email: "b@example.com",
    });
    const server = buildApp({ limits: { createAnime: limit(2) } });
    const post = (token) =>
      withSession(server.post("/api/anime"), token).send({});

    expect((await post(a.token)).status).toBe(400);
    expect((await post(a.token)).status).toBe(400);
    expectLimited(await post(a.token));

    // Same IP, different user: not affected.
    expect((await post(b.token)).status).toBe(400);
  });

  it("requests without a session get 401, not 429", async () => {
    const server = buildApp({ limits: { createAnime: limit(1) } });
    for (let i = 0; i < 3; i++) {
      expect((await server.post("/api/anime").send({})).status).toBe(401);
    }
  });
});

describe("global /api limiter", () => {
  it("429 after the limit, and does not affect the root route", async () => {
    const server = buildApp({ limits: { global: limit(3) } });

    for (let i = 0; i < 3; i++) {
      expect((await server.get("/api/auth/profile")).status).toBe(401);
    }
    expectLimited(await server.get("/api/auth/profile"));
    expect((await server.get("/")).status).toBe(200);
  });
});

describe("when disabled", () => {
  it("never returns 429", async () => {
    const server = buildApp({
      enabled: false,
      limits: { loginEmail: limit(1) },
    });
    for (let i = 0; i < 8; i++) {
      expect((await wrongLogin(server, "x@example.com")).status).toBe(401);
    }
  });
});
