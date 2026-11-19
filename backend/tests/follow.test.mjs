import request from "supertest";
import { describe, expect, it } from "vitest";
import env from "../src/config/env.mjs";
import { createApp } from "../src/app.mjs";
import db from "../src/config/db.mjs";
import { api, createUserAndLogin, withSession } from "./support/helpers.mjs";

const followUrl = (username) =>
  `/api/users/${encodeURIComponent(username)}/follow`;
const profileUrl = (username) => `/api/users/${encodeURIComponent(username)}`;

const alice = () =>
  createUserAndLogin({ name: "alice", email: "alice@example.com" });
const bob = () => createUserAndLogin({ name: "bob", email: "bob@example.com" });
const carol = () =>
  createUserAndLogin({ name: "carol", email: "carol@example.com" });

const follow = (token, username, app) =>
  withSession((app ? request(app) : api()).post(followUrl(username)), token);
const unfollow = (token, username, app) =>
  withSession((app ? request(app) : api()).delete(followUrl(username)), token);
const getProfile = (username, token) =>
  token
    ? withSession(api().get(profileUrl(username)), token)
    : api().get(profileUrl(username));

const countRows = async () => {
  const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM follows");
  return total;
};

const expectError = (res, status) => {
  expect(res.status).toBe(status);
  expect(res.body.status).toBe("error");
  expect(typeof res.body.message).toBe("string");
};

describe("POST /api/users/:username/follow", () => {
  it("200: mengikuti dan mengembalikan hitungan terbaru", async () => {
    const a = await alice();
    await bob();

    const res = await follow(a.token, "bob");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toEqual({
      username: "bob",
      isFollowing: true,
      followersCount: 1,
    });
  });

  it("idempotent: follow dua kali tetap satu baris", async () => {
    const a = await alice();
    await bob();

    expect((await follow(a.token, "bob")).status).toBe(200);
    const second = await follow(a.token, "bob");

    expect(second.status).toBe(200);
    expect(second.body.data.followersCount).toBe(1);
    expect(await countRows()).toBe(1);
  });

  it("dua follow bersamaan tidak 500 dan tetap satu baris", async () => {
    const a = await alice();
    await bob();

    const results = await Promise.all(
      Array.from({ length: 5 }, () => follow(a.token, "bob")),
    );

    results.forEach((res) => expect(res.status).toBe(200));
    expect(await countRows()).toBe(1);
  });

  it("400: mengikuti diri sendiri", async () => {
    const a = await alice();
    const res = await follow(a.token, "alice");
    expectError(res, 400);
    expect(res.body.message).toBe("Tidak bisa mengikuti diri sendiri");
    expect(await countRows()).toBe(0);
  });

  it("404: username tidak ada", async () => {
    const a = await alice();
    expectError(await follow(a.token, "tidakada"), 404);
  });

  it("400: username kurang dari 3 karakter", async () => {
    const a = await alice();
    expectError(await follow(a.token, "ab"), 400);
  });

  it("401: tanpa login", async () => {
    await bob();
    expectError(await api().post(followUrl("bob")), 401);
  });

  it("403: tanpa header CSRF", async () => {
    const a = await alice();
    await bob();
    const res = await withSession(api().post(followUrl("bob")), a.token, {
      csrf: false,
    });
    expectError(res, 403);
    expect(await countRows()).toBe(0);
  });

  it("profil privat: follow berhasil, stats tetap null", async () => {
    const a = await alice();
    const b = await bob();
    await withSession(api().put("/api/users/profile"), b.token).send({
      displayName: null,
      bio: null,
      isPrivate: true,
    });

    const res = await follow(a.token, "bob");
    expect(res.status).toBe(200);
    expect(res.body.data.followersCount).toBe(1);

    const profile = (await getProfile("bob", a.token)).body.data;
    expect(profile.isPrivate).toBe(true);
    expect(profile.stats).toBeNull();
    expect(profile.followersCount).toBe(1);
    expect(profile.isFollowing).toBe(true);
  });
});

describe("DELETE /api/users/:username/follow", () => {
  it("200: berhenti mengikuti", async () => {
    const a = await alice();
    await bob();
    await follow(a.token, "bob");

    const res = await unfollow(a.token, "bob");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      username: "bob",
      isFollowing: false,
      followersCount: 0,
    });
    expect(await countRows()).toBe(0);
  });

  it("idempotent: unfollow dua kali dan saat tidak mengikuti tetap 200", async () => {
    const a = await alice();
    await bob();
    await follow(a.token, "bob");

    expect((await unfollow(a.token, "bob")).status).toBe(200);
    const second = await unfollow(a.token, "bob");
    expect(second.status).toBe(200);
    expect(second.body.data.isFollowing).toBe(false);

    const never = await unfollow(a.token, "bob");
    expect(never.status).toBe(200);
  });

  it("hanya menghapus follow milik pemanggil", async () => {
    const a = await alice();
    const c = await carol();
    await bob();
    await follow(a.token, "bob");
    await follow(c.token, "bob");

    const res = await unfollow(a.token, "bob");
    expect(res.body.data.followersCount).toBe(1);
  });

  it("400: diri sendiri", async () => {
    const a = await alice();
    const res = await unfollow(a.token, "alice");
    expectError(res, 400);
    expect(res.body.message).toBe("Tidak bisa mengikuti diri sendiri");
  });

  it("404: username tidak ada", async () => {
    const a = await alice();
    expectError(await unfollow(a.token, "tidakada"), 404);
  });

  it("401: tanpa login", async () => {
    await bob();
    expectError(await api().delete(followUrl("bob")), 401);
  });

  it("403: tanpa header CSRF", async () => {
    const a = await alice();
    await bob();
    const res = await withSession(api().delete(followUrl("bob")), a.token, {
      csrf: false,
    });
    expectError(res, 403);
  });
});

describe("GET /api/users/:username: followersCount, followingCount, isFollowing", () => {
  it("hitungan berubah mengikuti follow dan unfollow", async () => {
    const a = await alice();
    const c = await carol();
    await bob();

    let bobProfile = (await getProfile("bob")).body.data;
    expect(bobProfile.followersCount).toBe(0);
    expect(bobProfile.followingCount).toBe(0);

    await follow(a.token, "bob");
    await follow(c.token, "bob");
    await follow(a.token, "carol");

    bobProfile = (await getProfile("bob")).body.data;
    const aliceProfile = (await getProfile("alice")).body.data;
    const carolProfile = (await getProfile("carol")).body.data;
    expect(bobProfile.followersCount).toBe(2);
    expect(bobProfile.followingCount).toBe(0);
    expect(aliceProfile.followingCount).toBe(2);
    expect(aliceProfile.followersCount).toBe(0);
    expect(carolProfile.followersCount).toBe(1);
    expect(carolProfile.followingCount).toBe(1);

    await unfollow(a.token, "bob");
    bobProfile = (await getProfile("bob")).body.data;
    expect(bobProfile.followersCount).toBe(1);
  });

  it("isFollowing: true untuk pengikut; false untuk bukan pengikut, anonim, dan pemilik", async () => {
    const a = await alice();
    const b = await bob();
    const c = await carol();
    await follow(a.token, "bob");

    const asFollower = (await getProfile("bob", a.token)).body.data;
    const asNonFollower = (await getProfile("bob", c.token)).body.data;
    const asAnon = (await getProfile("bob")).body.data;
    const asOwner = (await getProfile("bob", b.token)).body.data;

    expect(asFollower.isFollowing).toBe(true);
    expect(asNonFollower.isFollowing).toBe(false);
    expect(asAnon.isFollowing).toBe(false);
    expect(asOwner.isFollowing).toBe(false);
    expect(asOwner.isSelf).toBe(true);
  });

  it("jumlah tetap terlihat di profil privat untuk anonim", async () => {
    const a = await alice();
    const b = await bob();
    await withSession(api().put("/api/users/profile"), b.token).send({
      displayName: null,
      bio: null,
      isPrivate: true,
    });
    await follow(a.token, "bob");

    const anon = (await getProfile("bob")).body.data;
    expect(anon.stats).toBeNull();
    expect(anon.followersCount).toBe(1);
    expect(anon.followingCount).toBe(0);
  });
});

describe("follow/unfollow: pembatas laju", () => {
  // A fresh app has its own limiter memory, so state never leaks between tests.
  const limitedApp = () =>
    createApp({
      rateLimit: {
        enabled: true,
        limits: {
          ...env.rateLimit.limits,
          follow: { limit: 2, windowMs: 15 * 60 * 1000 },
        },
      },
    });

  it("429 pada permintaan ke-3 (follow + unfollow dihitung bersama), per user", async () => {
    const app = limitedApp();
    const a = await alice();
    const c = await carol();
    await bob();

    expect((await follow(a.token, "bob", app)).status).toBe(200);
    expect((await unfollow(a.token, "bob", app)).status).toBe(200);

    const blocked = await follow(a.token, "bob", app);
    expectError(blocked, 429);
    expect(blocked.body.message).toContain("permintaan follow");
    expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);

    // A different user is not locked out.
    expect((await follow(c.token, "bob", app)).status).toBe(200);
  });
});
