import request from "supertest";
import env from "../src/config/env.mjs";
import { createApp } from "../src/app.mjs";
import { describe, expect, it } from "vitest";
import db from "../src/config/db.mjs";
import { api, createUserAndLogin, withSession } from "./support/helpers.mjs";

const profileUrl = (username) => `/api/users/${encodeURIComponent(username)}`;
const UPDATE = "/api/users/profile";

const validBody = {
  displayName: "Si Otaku",
  bio: "Suka isekai",
  isPrivate: false,
};

const expectError = (res, status) => {
  expect(res.status).toBe(status);
  expect(res.body.status).toBe("error");
  expect(typeof res.body.message).toBe("string");
};

const owner = () =>
  createUserAndLogin({ name: "otaku", email: "otaku@example.com" });
const visitor = () =>
  createUserAndLogin({ name: "penonton", email: "penonton@example.com" });

let nextExternalId = 1000;
// Inserts catalog rows + watchlist rows straight into the test database.
const seedWatchlist = async (userId, items) => {
  for (const item of items) {
    const externalId = nextExternalId++;
    const [catalog] = await db.query(
      `INSERT INTO anime_catalog (source, external_id, title, total_episodes, anim_type)
       VALUES ('anilist', ?, ?, 12, 'TV')`,
      [externalId, `Anime ${externalId}`],
    );
    await db.query(
      `INSERT INTO user_anime (user_id, anime_id, status, episodes_watched, score)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, catalog.insertId, item.status, item.eps, item.score ?? null],
    );
  }
};

const sampleItems = [
  { status: "watching", eps: 5, score: 8.5 },
  { status: "completed", eps: 12, score: 10 },
  { status: "completed", eps: 12, score: 8 },
  { status: "dropped", eps: 3 },
  { status: "plan to watch", eps: 0, score: 7 },
];

describe("GET /api/users/:username", () => {
  it("200 anonim: default profil, tanpa data sensitif", async () => {
    const { user } = await owner();

    const res = await api().get(profileUrl("otaku"));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Object.keys(res.body.data).sort()).toEqual(
      [
        "bio",
        "displayName",
        "followersCount",
        "followingCount",
        "isFollowing",
        "isPrivate",
        "isSelf",
        "joinedAt",
        "stats",
        "username",
      ].sort(),
    );
    expect(res.body.data).toMatchObject({
      username: "otaku",
      displayName: "otaku",
      bio: null,
      isPrivate: false,
      isSelf: false,
    });
    expect(new Date(res.body.data.joinedAt).toISOString()).toBe(
      res.body.data.joinedAt,
    );

    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain(user.email);
    expect(raw).not.toMatch(/password|us_id|"email"/i);
  });

  it("isSelf false untuk user lain, true untuk pemilik", async () => {
    const { token: ownerToken } = await owner();
    const { token: otherToken } = await visitor();

    const asOther = await withSession(
      api().get(profileUrl("otaku")),
      otherToken,
    );
    const asOwner = await withSession(
      api().get(profileUrl("otaku")),
      ownerToken,
    );

    expect(asOther.body.data.isSelf).toBe(false);
    expect(asOwner.body.data.isSelf).toBe(true);
  });

  it("cookie tidak valid tetap 200 sebagai anonim", async () => {
    await owner();
    const res = await api()
      .get(profileUrl("otaku"))
      .set("Cookie", "access_token=bukan.token.valid");

    expect(res.status).toBe(200);
    expect(res.body.data.isSelf).toBe(false);
  });

  it("404 untuk username yang tidak ada", async () => {
    expectError(await api().get(profileUrl("tidakada")), 404);
  });

  it("400 untuk username kurang dari 3 karakter", async () => {
    expectError(await api().get(profileUrl("ab")), 400);
  });

  it("200 untuk pengguna lama dengan nama berspasi (ter-encode)", async () => {
    await db.query("CALL sp_insert_user(?, ?, ?)", [
      "nama lama",
      "lama@example.com",
      "hash-bebas",
    ]);

    const res = await api().get(profileUrl("nama lama"));

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe("nama lama");
  });

  describe("statistik", () => {
    it("kosong: semua nol, meanScore null, 10 kunci skor", async () => {
      await owner();
      const { stats } = (await api().get(profileUrl("otaku"))).body.data;

      expect(stats).toEqual({
        total: 0,
        byStatus: { watching: 0, completed: 0, dropped: 0, "plan to watch": 0 },
        episodesWatched: 0,
        meanScore: null,
        scoreDistribution: Object.fromEntries(
          Array.from({ length: 10 }, (_, i) => [String(i + 1), 0]),
        ),
      });
    });

    it("benar untuk data contoh (semua status, skor desimal, tanpa skor)", async () => {
      const { user } = await owner();
      await seedWatchlist(user.id, sampleItems);

      const { stats } = (await api().get(profileUrl("otaku"))).body.data;

      expect(stats.total).toBe(5);
      expect(stats.byStatus).toEqual({
        watching: 1,
        completed: 2,
        dropped: 1,
        "plan to watch": 1,
      });
      expect(stats.episodesWatched).toBe(32);
      expect(stats.meanScore).toBe(8.4); // (8.5 + 10 + 8 + 7) / 4 = 8.375
      expect(stats.scoreDistribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 1,
        8: 2,
        9: 0,
        10: 1,
      });
    });

    it("tidak menghitung watchlist milik user lain", async () => {
      const { user } = await owner();
      const other = await visitor();
      await seedWatchlist(user.id, [{ status: "watching", eps: 1, score: 5 }]);
      await seedWatchlist(other.user.id, sampleItems);

      const { stats } = (await api().get(profileUrl("otaku"))).body.data;
      expect(stats.total).toBe(1);
    });
  });

  describe("profil privat", () => {
    it("stats null untuk anonim dan user lain, penuh untuk pemilik", async () => {
      const { user, token } = await owner();
      const other = await visitor();
      await seedWatchlist(user.id, sampleItems);
      await withSession(api().put(UPDATE), token).send({
        ...validBody,
        isPrivate: true,
      });

      const anon = await api().get(profileUrl("otaku"));
      const asOther = await withSession(
        api().get(profileUrl("otaku")),
        other.token,
      );
      const asOwner = await withSession(api().get(profileUrl("otaku")), token);

      expect(anon.body.data.stats).toBeNull();
      expect(asOther.body.data.stats).toBeNull();
      expect(anon.body.data.isPrivate).toBe(true);
      expect(anon.body.data.displayName).toBe("Si Otaku");
      expect(asOwner.body.data.stats.total).toBe(5);
    });
  });
});

describe("PUT /api/users/profile", () => {
  const countProfiles = async () => {
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM user_profiles",
    );
    return total;
  };

  it("200: mengembalikan profil terbaru dengan isSelf true", async () => {
    const { token } = await owner();

    const res = await withSession(api().put(UPDATE), token).send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      username: "otaku",
      displayName: "Si Otaku",
      bio: "Suka isekai",
      isPrivate: false,
      isSelf: true,
    });
    expect(res.body.data.stats).not.toBeNull();
    expect(JSON.stringify(res.body)).not.toMatch(/password|us_id|"email"/i);
  });

  it("upsert: baris dibuat saat PUT pertama, PUT berikutnya memperbarui", async () => {
    const { token } = await owner();
    expect(await countProfiles()).toBe(0);

    await withSession(api().put(UPDATE), token).send(validBody);
    expect(await countProfiles()).toBe(1);

    const second = await withSession(api().put(UPDATE), token).send({
      displayName: "Nama Baru",
      bio: null,
      isPrivate: true,
    });
    expect(await countProfiles()).toBe(1);
    expect(second.body.data).toMatchObject({
      displayName: "Nama Baru",
      bio: null,
      isPrivate: true,
    });
  });

  it("displayName null kembali ke username", async () => {
    const { token } = await owner();
    const res = await withSession(api().put(UPDATE), token).send({
      displayName: null,
      bio: null,
      isPrivate: false,
    });
    expect(res.body.data.displayName).toBe("otaku");
  });

  it("tidak mengubah profil user lain", async () => {
    const { token } = await owner();
    await visitor();
    await withSession(api().put(UPDATE), token).send(validBody);

    const other = (await api().get(profileUrl("penonton"))).body.data;
    expect(other.displayName).toBe("penonton");
    expect(other.bio).toBeNull();
  });

  it.each([
    ["bio lebih dari 500 karakter", { bio: "x".repeat(501) }],
    ["displayName kosong", { displayName: "" }],
    ["displayName hanya spasi", { displayName: "   " }],
    ["displayName lebih dari 100 karakter", { displayName: "x".repeat(101) }],
    ["isPrivate tidak dikirim", { isPrivate: undefined }],
    ["isPrivate bukan boolean", { isPrivate: "true" }],
    ["bio tidak dikirim", { bio: undefined }],
    ["field asing avatarUrl", { avatarUrl: "https://x.test/a.png" }],
    ["field asing bannerUrl", { bannerUrl: "https://x.test/b.png" }],
  ])("400: %s", async (_label, override) => {
    const { token } = await owner();

    const res = await withSession(api().put(UPDATE), token).send({
      ...validBody,
      ...override,
    });

    expectError(res, 400);
    expect(await countProfiles()).toBe(0);
  });

  it("403: tanpa header CSRF", async () => {
    const { token } = await owner();
    const res = await withSession(api().put(UPDATE), token, {
      csrf: false,
    }).send(validBody);
    expectError(res, 403);
  });

  it("401: tanpa login", async () => {
    expectError(await api().put(UPDATE).send(validBody), 401);
  });
});

describe("PUT /api/users/profile: pembatas laju", () => {
  // A fresh app has its own limiter memory, so state never leaks between tests.
  // Sessions are JWT cookies, so a login on the default app works here too.
  const limitedApp = () =>
    createApp({
      rateLimit: {
        enabled: true,
        limits: {
          ...env.rateLimit.limits,
          profileUpdate: { limit: 2, windowMs: 15 * 60 * 1000 },
        },
      },
    });

  it("429 pada permintaan ke-3, dihitung per user, ada Retry-After", async () => {
    const app = limitedApp();
    const first = await owner();
    const second = await visitor();
    const put = (token) =>
      withSession(request(app).put(UPDATE), token).send(validBody);

    expect((await put(first.token)).status).toBe(200);
    expect((await put(first.token)).status).toBe(200);

    const blocked = await put(first.token);
    expectError(blocked, 429);
    expect(blocked.body.message).toContain("perubahan profil");
    expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);

    // A different user is not locked out.
    expect((await put(second.token)).status).toBe(200);
  });
});
