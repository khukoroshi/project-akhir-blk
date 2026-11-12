import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../src/app.mjs";
import env from "../src/config/env.mjs";
import { api, authHeader, defaultCredentials } from "./support/helpers.mjs";

const REGISTER = "/api/auth/register";
const LOGIN = "/api/auth/login";
const LOGOUT = "/api/auth/logout";
const PROFILE = "/api/auth/profile";
const ALLOWED_ORIGIN = env.cors.origins[0];

const findCookie = (res, name) =>
  (res.headers["set-cookie"] ?? []).find((c) => c.startsWith(`${name}=`));
const cookieValue = (setCookie) => setCookie.split(";")[0].split("=")[1];

const loginWithAgent = async () => {
  await api().post(REGISTER).send(defaultCredentials);
  const agent = request.agent(app);
  const res = await agent.post(LOGIN).send({
    email: defaultCredentials.email,
    password: defaultCredentials.password,
  });
  expect(res.status).toBe(200);
  return {
    agent,
    res,
    token: res.body.data.token,
    csrf: cookieValue(findCookie(res, "csrf_token")),
  };
};

const call = (client, method, url, body) => {
  const req = client[method](url);
  return body ? req.send(body) : req;
};

const expectPassedGuards = (res) => {
  expect(res.status).not.toBe(401);
  expect(res.status).not.toBe(403);
};

const MUTATING = [
  { name: "POST", method: "post", url: "/api/anime", body: {} },
  {
    name: "PUT",
    method: "put",
    url: "/api/anime/999999",
    body: { eps: 0, status: "watching" },
  },
  { name: "PATCH", method: "patch", url: "/api/anime/999999/increment" },
  { name: "DELETE", method: "delete", url: "/api/anime/999999" },
];

describe("POST /api/auth/login: cookie", () => {
  it("mengatur access_token (HttpOnly) dan csrf_token (bukan HttpOnly)", async () => {
    const { res, token } = await loginWithAgent();
    const access = findCookie(res, "access_token");
    const csrf = findCookie(res, "csrf_token");

    expect(access).toBeDefined();
    expect(csrf).toBeDefined();

    expect(access).toMatch(/;\s*HttpOnly/i);
    expect(csrf).not.toMatch(/HttpOnly/i);

    for (const cookie of [access, csrf]) {
      expect(cookie).toMatch(/Path=\//i);
      expect(cookie).toMatch(/SameSite=Lax/i);
      expect(cookie).not.toMatch(/;\s*Secure/i); // .env.test: COOKIE_SECURE=false
    }

    expect(cookieValue(access)).toBe(token);
    expect(cookieValue(csrf)).toMatch(/^[0-9a-f]{64}$/);

    const { iat, exp } = jwt.decode(token);
    for (const cookie of [access, csrf]) {
      expect(Number(cookie.match(/Max-Age=(\d+)/i)[1])).toBe(exp - iat);
    }
  });

  it("body respons tetap memuat user dan token", async () => {
    const { res } = await loginWithAgent();
    expect(res.body.data.user).toMatchObject({
      email: defaultCredentials.email,
    });
    expect(res.body.data.token.split(".")).toHaveLength(3);
  });

  it("login ulang dengan cookie lama tidak butuh CSRF", async () => {
    const { agent } = await loginWithAgent();
    const res = await agent.post(LOGIN).send({
      email: defaultCredentials.email,
      password: defaultCredentials.password,
    });
    expect(res.status).toBe(200);
  });
});

describe("autentikasi lewat cookie", () => {
  it("200: profil dengan cookie saja", async () => {
    const { agent } = await loginWithAgent();
    const res = await agent.get(PROFILE);
    expect(res.status).toBe(200);
    expect(res.body.data.userInfo.email).toBe(defaultCredentials.email);
  });

  it("200: GET watchlist dengan cookie tanpa X-CSRF-Token", async () => {
    const { agent } = await loginWithAgent();
    const res = await agent.get("/api/anime");
    expect(res.status).toBe(200);
  });

  it("401: cookie access_token rusak", async () => {
    const res = await api()
      .get(PROFILE)
      .set("Cookie", "access_token=bukan.token.valid");
    expect(res.status).toBe(401);
  });

  it.each(MUTATING)(
    "401: $name tanpa cookie dan tanpa Bearer (bukan 403)",
    async ({ method, url, body }) => {
      const res = await call(api(), method, url, body);
      expect(res.status).toBe(401);
    },
  );
});

describe("CSRF untuk request ber-cookie", () => {
  it.each(MUTATING)(
    "403: $name dengan cookie tanpa X-CSRF-Token",
    async ({ method, url, body }) => {
      const { agent } = await loginWithAgent();
      const res = await call(agent, method, url, body);
      expect(res.status).toBe(403);
      expect(res.body.status).toBe("error");
      expect(res.body.message).toBe("Token CSRF tidak valid");
    },
  );

  it.each(MUTATING)(
    "403: $name dengan X-CSRF-Token salah",
    async ({ method, url, body }) => {
      const { agent } = await loginWithAgent();
      const res = await call(agent, method, url, body).set(
        "X-CSRF-Token",
        "salah",
      );
      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Token CSRF tidak valid");
    },
  );

  it.each(MUTATING)(
    "lolos: $name dengan X-CSRF-Token benar",
    async ({ method, url, body }) => {
      const { agent, csrf } = await loginWithAgent();
      const res = await call(agent, method, url, body).set(
        "X-CSRF-Token",
        csrf,
      );
      expectPassedGuards(res);
    },
  );

  it("403: header ada tetapi cookie csrf_token tidak ada", async () => {
    const { token } = await loginWithAgent();
    const res = await api()
      .delete("/api/anime/999999")
      .set("Cookie", `access_token=${token}`)
      .set("X-CSRF-Token", "apa-saja");
    expect(res.status).toBe(403);
  });
});

describe("Bearer lama tetap berfungsi", () => {
  it.each(MUTATING)(
    "lolos: $name dengan Bearer tanpa CSRF",
    async ({ method, url, body }) => {
      const { token } = await loginWithAgent();
      const res = await call(api(), method, url, body).set(authHeader(token));
      expectPassedGuards(res);
    },
  );

  it("header Authorization didahulukan: Bearer rusak + cookie valid = 401", async () => {
    const { agent } = await loginWithAgent();
    const res = await agent
      .get(PROFILE)
      .set("Authorization", "Bearer bukan.token.valid");
    expect(res.status).toBe(401);
  });

  it("Bearer valid + cookie tidak memicu CSRF", async () => {
    const { agent, token } = await loginWithAgent();
    const res = await agent.delete("/api/anime/999999").set(authHeader(token));
    expectPassedGuards(res);
  });
});

describe("POST /api/auth/logout", () => {
  it("200: menghapus kedua cookie tanpa CSRF, setelahnya 401", async () => {
    const { agent } = await loginWithAgent();

    const res = await agent.post(LOGOUT);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");

    for (const name of ["access_token", "csrf_token"]) {
      const cleared = findCookie(res, name);
      expect(cleared).toMatch(new RegExp(`^${name}=;`));
      expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/i);
      expect(cleared).toMatch(/Path=\//i);
      expect(cleared).toMatch(/SameSite=Lax/i);
    }

    const after = await agent.get(PROFILE);
    expect(after.status).toBe(401);
  });

  it("200: tanpa sesi sama sekali", async () => {
    const res = await api().post(LOGOUT);
    expect(res.status).toBe(200);
  });

  it("200: dengan token tidak valid", async () => {
    const res = await api().post(LOGOUT).set("Authorization", "Bearer ngawur");
    expect(res.status).toBe(200);
  });
});

describe("CORS", () => {
  it("origin diizinkan mendapat ACAO persis dan Allow-Credentials", async () => {
    const res = await api().get("/").set("Origin", ALLOWED_ORIGIN);
    expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("origin lain tidak mendapat header ACAO", async () => {
    const res = await api().get("/").set("Origin", "https://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("tanpa header Origin tidak ada ACAO dan tidak wildcard", async () => {
    const res = await api().get("/");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("preflight: origin diizinkan, X-CSRF-Token dan metode diizinkan", async () => {
    const res = await api()
      .options("/api/anime")
      .set("Origin", ALLOWED_ORIGIN)
      .set("Access-Control-Request-Method", "DELETE")
      .set("Access-Control-Request-Headers", "x-csrf-token,content-type");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.headers["access-control-allow-headers"]).toMatch(
      /X-CSRF-Token/i,
    );
    expect(res.headers["access-control-allow-methods"]).toMatch(/DELETE/);
  });

  it("preflight: origin lain tidak mendapat ACAO", async () => {
    const res = await api()
      .options("/api/anime")
      .set("Origin", "https://evil.example")
      .set("Access-Control-Request-Method", "POST");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
