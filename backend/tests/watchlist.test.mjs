import { describe, expect, it } from "vitest";
import db from "../src/config/db.mjs";
import { api, authHeader, createUserAndLogin } from "./support/helpers.mjs";

const ANIME = "/api/anime";
const USER_B = { name: "penguji-b", email: "penguji-b@example.com" };

const ANIME_KEYS = [
  "anim_id",
  "us_id",
  "external_id",
  "external_source",
  "anim_title",
  "anim_img_url",
  "anim_current_episode",
  "anim_total_episode",
  "anim_type",
  "anim_status",
  "anim_tier",
  "anim_score",
  "anim_personal_notes",
  "anim_created_at",
].sort();

const expectError = (res, status) => {
  expect(res.status).toBe(status);
  expect(res.body.status).toBe("error");
  expect(typeof res.body.message).toBe("string");
};

// method: "get" | "post" | "put" | "patch" | "delete". token is optional.
const send = (method, path, token, body) => {
  let req = api()[method](path);
  if (token) req = req.set(authHeader(token));
  return body === undefined ? req : req.send(body);
};

const validBody = (overrides = {}) => ({
  externalId: 1535,
  title: "Death Note",
  ...overrides,
});

// PUT is a full update, so every test starts from a complete valid body.
const putBody = (overrides = {}) => ({
  eps: 3,
  teps: 12,
  status: "watching",
  ...overrides,
});

const addAnime = async (token, overrides) => {
  const res = await send("post", ANIME, token, validBody(overrides));
  if (res.status !== 201) {
    throw new Error(`Helper POST /anime gagal: ${res.status}`);
  }
  return res.body.data;
};

const getOne = (token, animId) => send("get", `${ANIME}/${animId}`, token);

const countWatchlist = async () => {
  const [[{ total }]] = await db.query(
    "SELECT COUNT(*) AS total FROM user_anime",
  );
  return total;
};

const countCatalog = async () => {
  const [[{ total }]] = await db.query(
    "SELECT COUNT(*) AS total FROM anime_catalog",
  );
  return total;
};

const twoUsers = async () => {
  const a = await createUserAndLogin();
  const b = await createUserAndLogin(USER_B);
  return { a, b };
};

describe("autentikasi watchlist", () => {
  it.each([
    ["get", ANIME, undefined],
    ["get", `${ANIME}/1`, undefined],
    ["post", ANIME, validBody()],
    ["put", `${ANIME}/1`, putBody()],
    ["patch", `${ANIME}/1/increment`, undefined],
    ["delete", `${ANIME}/1`, undefined],
  ])("401: %s %s tanpa token", async (method, path, body) => {
    const res = await send(method, path, undefined, body);
    expectError(res, 401);
  });

  it("401: token tidak valid", async () => {
    const res = await send("get", ANIME, "bukan.token.valid");
    expectError(res, 401);
  });
});

describe("POST /api/anime", () => {
  it("201: sukses minimal, bentuk objek Anime lengkap dan nilai default", async () => {
    const { user, token } = await createUserAndLogin();

    const res = await send("post", ANIME, token, validBody());

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(Object.keys(res.body.data).sort()).toEqual(ANIME_KEYS);
    expect(res.body.data).toMatchObject({
      anim_id: expect.any(Number),
      us_id: user.id,
      external_id: 1535,
      external_source: "anilist",
      anim_title: "Death Note",
      anim_img_url: null,
      anim_current_episode: 0,
      anim_total_episode: 0,
      anim_type: "TV",
      anim_status: "watching",
      anim_tier: null,
      anim_score: null,
      anim_personal_notes: null,
    });
    expect(typeof res.body.data.anim_created_at).toBe("string");
    expect(res.body.data.anim_created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Number.isNaN(Date.parse(res.body.data.anim_created_at))).toBe(false);
  });

  it("201: title di-trim", async () => {
    const { token } = await createUserAndLogin();

    const res = await send(
      "post",
      ANIME,
      token,
      validBody({ title: "  Naruto  " }),
    );

    expect(res.status).toBe(201);
    expect(res.body.data.anim_title).toBe("Naruto");
  });

  it("201: title 255 karakter diterima", async () => {
    const { token } = await createUserAndLogin();

    const res = await send(
      "post",
      ANIME,
      token,
      validBody({ title: "a".repeat(255) }),
    );

    expect(res.status).toBe(201);
  });

  it.each([
    ["MOVIE", "Movie"],
    ["movie", "Movie"],
    ["TV_SHORT", "TV Short"],
    ["music", "Music"],
    ["tv", "TV"],
    ["Special", "Special"],
  ])("201: type %s dinormalisasi menjadi %s", async (input, expected) => {
    const { token } = await createUserAndLogin();

    const res = await send("post", ANIME, token, validBody({ type: input }));

    expect(res.status).toBe(201);
    expect(res.body.data.anim_type).toBe(expected);
  });

  it.each([1, 8, 8.5, 10])(
    "201: score %s tersimpan dan kembali bertipe number",
    async (score) => {
      const { token } = await createUserAndLogin();

      const res = await send("post", ANIME, token, validBody({ score }));

      expect(res.status).toBe(201);
      expect(typeof res.body.data.anim_score).toBe("number");
      expect(res.body.data.anim_score).toBe(score);
    },
  );

  it.each(["watching", "completed", "dropped", "plan to watch"])(
    "201: status %s diterima",
    async (status) => {
      const { token } = await createUserAndLogin();

      const res = await send("post", ANIME, token, validBody({ status }));

      expect(res.status).toBe(201);
      expect(res.body.data.anim_status).toBe(status);
    },
  );

  it("201: semua field diisi", async () => {
    const { token } = await createUserAndLogin();

    const res = await send(
      "post",
      ANIME,
      token,
      validBody({
        imgUrl: "https://cdn.example.com/dn.jpg",
        totalEps: 37,
        type: "TV",
        status: "plan to watch",
        tier: "A",
        score: 8.5,
        notes: "Bagus sekali",
      }),
    );

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      anim_img_url: "https://cdn.example.com/dn.jpg",
      anim_total_episode: 37,
      anim_type: "TV",
      anim_status: "plan to watch",
      anim_tier: "A",
      anim_score: 8.5,
      anim_personal_notes: "Bagus sekali",
    });
  });

  it("201: imgUrl, tier, score, notes boleh null", async () => {
    const { token } = await createUserAndLogin();

    const res = await send(
      "post",
      ANIME,
      token,
      validBody({ imgUrl: null, tier: null, score: null, notes: null }),
    );

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      anim_img_url: null,
      anim_tier: null,
      anim_score: null,
      anim_personal_notes: null,
    });
  });

  it("409: anime yang sama ditambah dua kali", async () => {
    const { token } = await createUserAndLogin();
    await addAnime(token);

    const res = await send("post", ANIME, token, validBody());

    expectError(res, 409);
    expect(await countWatchlist()).toBe(1);
  });

  it.each([
    ["externalId tidak dikirim", { externalId: undefined }],
    ["externalId null", { externalId: null }],
    ["externalId 0", { externalId: 0 }],
    ["externalId negatif", { externalId: -5 }],
    ["externalId desimal", { externalId: 1.5 }],
    ["externalId string angka", { externalId: "1535" }],
    ["externalId bukan angka", { externalId: "abc" }],
    ["title tidak dikirim", { title: undefined }],
    ["title kosong", { title: "" }],
    ["title hanya spasi", { title: "   " }],
    ["title 256 karakter", { title: "a".repeat(256) }],
    ["externalSource jikan", { externalSource: "jikan" }],
    ["imgUrl bukan URL", { imgUrl: "bukan-url" }],
    ["imgUrl protokol ftp", { imgUrl: "ftp://example.com/a.png" }],
    ["imgUrl protokol javascript", { imgUrl: "javascript:alert(1)" }],
    [
      "imgUrl lebih dari 500 karakter",
      { imgUrl: `https://example.com/${"a".repeat(500)}` },
    ],
    ["totalEps negatif", { totalEps: -1 }],
    ["totalEps desimal", { totalEps: 1.5 }],
    ["type tidak valid", { type: "Bogus" }],
    ["status tidak valid", { status: "bogus" }],
    ["status 'on hold' ditolak", { status: "on hold" }],
    ["tier tidak valid", { tier: "E" }],
    ["score 0", { score: 0 }],
    ["score 10.5", { score: 10.5 }],
    ["score 8.55", { score: 8.55 }],
    ["score berupa string", { score: "8" }],
    ["notes lebih dari 2000 karakter", { notes: "a".repeat(2001) }],
    ["field asing", { foo: "bar" }],
    ["field asing us_id", { us_id: 999 }],
  ])("400: %s", async (_label, override) => {
    const { token } = await createUserAndLogin();

    const res = await send("post", ANIME, token, validBody(override));

    expectError(res, 400);
    expect(await countWatchlist()).toBe(0);
  });
});

describe("GET /api/anime dan GET /api/anime/:anim_id", () => {
  it("200: list kosong untuk user baru", async () => {
    const { token } = await createUserAndLogin();

    const res = await send("get", ANIME, token);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.results).toBe(0);
    expect(res.body.data).toEqual([]);
  });

  it("200: list hanya berisi data milik sendiri", async () => {
    const { a, b } = await twoUsers();
    await addAnime(a.token, { externalId: 1, title: "A1" });
    await addAnime(a.token, { externalId: 2, title: "A2" });
    await addAnime(b.token, { externalId: 3, title: "B1" });

    const resA = await send("get", ANIME, a.token);
    const resB = await send("get", ANIME, b.token);

    expect(resA.status).toBe(200);
    expect(resA.body.results).toBe(2);
    expect(resA.body.data).toHaveLength(2);
    expect(resA.body.data.every((x) => x.us_id === a.user.id)).toBe(true);
    expect(resB.body.results).toBe(1);
    expect(resB.body.data[0].us_id).toBe(b.user.id);
  });

  it("200: detail milik sendiri sama dengan hasil POST", async () => {
    const { token } = await createUserAndLogin();
    const created = await addAnime(token, { totalEps: 12, score: 7.5 });

    const res = await getOne(token, created.anim_id);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(created);
  });

  it("404: id tidak ada di watchlist", async () => {
    const { token } = await createUserAndLogin();

    const res = await getOne(token, 999999);

    expectError(res, 404);
  });

  it("404: id milik user lain", async () => {
    const { a, b } = await twoUsers();
    const created = await addAnime(a.token);

    const res = await getOne(b.token, created.anim_id);

    expectError(res, 404);
  });
});

describe("anim_id tidak valid", () => {
  const INVALID_IDS = ["abc", "0", "-1", "1.5"];
  const targets = {
    get: (id) => [`${ANIME}/${id}`, undefined],
    put: (id) => [`${ANIME}/${id}`, putBody()],
    patch: (id) => [`${ANIME}/${id}/increment`, undefined],
    delete: (id) => [`${ANIME}/${id}`, undefined],
  };

  it.each(Object.keys(targets))(
    "400: %s dengan id bukan bilangan bulat positif",
    async (method) => {
      const { token } = await createUserAndLogin();

      for (const id of INVALID_IDS) {
        const [path, body] = targets[method](id);
        const res = await send(method, path, token, body);
        expect(res.status, `${method} ${path}`).toBe(400);
        expect(res.body.status).toBe("error");
      }
    },
  );
});

describe("PUT /api/anime/:anim_id", () => {
  it("200: update penuh dan tersimpan", async () => {
    const { token } = await createUserAndLogin();
    const created = await addAnime(token, { totalEps: 12 });

    const res = await send(
      "put",
      `${ANIME}/${created.anim_id}`,
      token,
      putBody({
        eps: 5,
        status: "dropped",
        tier: "S",
        score: 9.5,
        notes: "Mantap",
      }),
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      anim_id: created.anim_id,
      anim_current_episode: 5,
      anim_total_episode: 12,
      anim_status: "dropped",
      anim_tier: "S",
      anim_score: 9.5,
      anim_personal_notes: "Mantap",
    });
    expect(typeof res.body.data.anim_score).toBe("number");

    const persisted = await getOne(token, created.anim_id);
    expect(persisted.body.data).toEqual(res.body.data);
  });

  it("200: completed dengan teps > 0 membuat eps = teps", async () => {
    const { token } = await createUserAndLogin();
    const created = await addAnime(token, { totalEps: 12 });

    const res = await send(
      "put",
      `${ANIME}/${created.anim_id}`,
      token,
      putBody({ eps: 3, teps: 12, status: "completed" }),
    );

    expect(res.status).toBe(200);
    expect(res.body.data.anim_status).toBe("completed");
    expect(res.body.data.anim_current_episode).toBe(12);
  });

  it("200: completed dengan teps 0 mempertahankan eps yang dikirim", async () => {
    const { token } = await createUserAndLogin();
    const created = await addAnime(token, { totalEps: 0 });

    const res = await send(
      "put",
      `${ANIME}/${created.anim_id}`,
      token,
      putBody({ eps: 7, teps: 0, status: "completed" }),
    );

    expect(res.status).toBe(200);
    expect(res.body.data.anim_current_episode).toBe(7);
    expect(res.body.data.anim_total_episode).toBe(0);
  });

  it("200: tier, score, notes yang tidak dikirim menjadi null", async () => {
    const { token } = await createUserAndLogin();
    const created = await addAnime(token, {
      totalEps: 12,
      tier: "A",
      score: 8.5,
      notes: "Catatan lama",
    });

    const res = await send(
      "put",
      `${ANIME}/${created.anim_id}`,
      token,
      putBody({ eps: 1 }),
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      anim_tier: null,
      anim_score: null,
      anim_personal_notes: null,
    });
  });

  it("400: eps melebihi teps (teps > 0), data tidak berubah", async () => {
    const { token } = await createUserAndLogin();
    const created = await addAnime(token, { totalEps: 12 });

    const res = await send(
      "put",
      `${ANIME}/${created.anim_id}`,
      token,
      putBody({ eps: 13, teps: 12 }),
    );

    expectError(res, 400);
    const after = await getOne(token, created.anim_id);
    expect(after.body.data).toEqual(created);
  });

  it.each([
    ["eps tidak dikirim", { eps: undefined }],
    ["teps tidak dikirim", { teps: undefined }],
    ["status hilang", { status: undefined }],
    ["eps negatif", { eps: -1 }],
    ["teps desimal", { teps: 1.5 }],
    ["eps berupa string", { eps: "3" }],
    ["status tidak valid", { status: "bogus" }],
    ["status 'on hold' ditolak", { status: "on hold" }],
    ["tier tidak valid", { tier: "E" }],
    ["score 10.5", { score: 10.5 }],
    ["notes lebih dari 2000 karakter", { notes: "a".repeat(2001) }],
    ["field asing", { foo: "bar" }],
  ])("400: %s, data tidak berubah", async (_label, override) => {
    const { token } = await createUserAndLogin();
    const created = await addAnime(token, { totalEps: 12 });

    const res = await send(
      "put",
      `${ANIME}/${created.anim_id}`,
      token,
      putBody(override),
    );

    expectError(res, 400);
    const after = await getOne(token, created.anim_id);
    expect(after.body.data).toEqual(created);
  });

  it("404: milik user lain", async () => {
    const { a, b } = await twoUsers();
    const created = await addAnime(a.token, { totalEps: 12 });

    const res = await send(
      "put",
      `${ANIME}/${created.anim_id}`,
      b.token,
      putBody(),
    );

    expectError(res, 404);
  });

  it("404: id tidak ada", async () => {
    const { token } = await createUserAndLogin();

    const res = await send("put", `${ANIME}/999999`, token, putBody());

    expectError(res, 404);
  });
});

describe("PATCH /api/anime/:anim_id/increment", () => {
  it("200: episode bertambah 1 setiap panggilan", async () => {
    const { token } = await createUserAndLogin();
    const created = await addAnime(token, { totalEps: 12 });
    const path = `${ANIME}/${created.anim_id}/increment`;

    const first = await send("patch", path, token);
    const second = await send("patch", path, token);

    expect(first.status).toBe(200);
    expect(first.body.data.anim_current_episode).toBe(1);
    expect(second.status).toBe(200);
    expect(second.body.data.anim_current_episode).toBe(2);
  });

  it("anime completed dengan total 0 tidak menghasilkan 500", async () => {
    const { token } = await createUserAndLogin();
    const created = await addAnime(token, { totalEps: 0, status: "completed" });

    const res = await send(
      "patch",
      `${ANIME}/${created.anim_id}/increment`,
      token,
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.anim_current_episode).toBe(
      created.anim_current_episode + 1,
    );
  });

  it("404: milik user lain", async () => {
    const { a, b } = await twoUsers();
    const created = await addAnime(a.token, { totalEps: 12 });

    const res = await send(
      "patch",
      `${ANIME}/${created.anim_id}/increment`,
      b.token,
    );

    expectError(res, 404);
  });

  it("404: id tidak ada", async () => {
    const { token } = await createUserAndLogin();

    const res = await send("patch", `${ANIME}/999999/increment`, token);

    expectError(res, 404);
  });
});

describe("DELETE /api/anime/:anim_id", () => {
  it("200 lalu 404 pada percobaan kedua", async () => {
    const { token } = await createUserAndLogin();
    const created = await addAnime(token);
    const path = `${ANIME}/${created.anim_id}`;

    const first = await send("delete", path, token);
    const second = await send("delete", path, token);

    expect(first.status).toBe(200);
    expect(first.body.status).toBe("success");
    expect(typeof first.body.message).toBe("string");
    expectError(second, 404);
    expectError(await getOne(token, created.anim_id), 404);
    expect(await countWatchlist()).toBe(0);
  });

  it("404: milik user lain, data pemilik tetap utuh", async () => {
    const { a, b } = await twoUsers();
    const created = await addAnime(a.token, { totalEps: 12 });

    const res = await send("delete", `${ANIME}/${created.anim_id}`, b.token);

    expectError(res, 404);
    const after = await getOne(a.token, created.anim_id);
    expect(after.status).toBe(200);
    expect(after.body.data).toEqual(created);
  });
});

describe("kepemilikan data", () => {
  it("user B tidak bisa GET/PUT/PATCH/DELETE item user A, item A tidak berubah", async () => {
    const { a, b } = await twoUsers();
    const original = await addAnime(a.token, {
      totalEps: 12,
      tier: "B",
      score: 7.5,
      notes: "Punya A",
    });
    const url = `${ANIME}/${original.anim_id}`;

    const attempts = [
      await send("get", url, b.token),
      await send("put", url, b.token, putBody({ eps: 9, status: "dropped" })),
      await send("patch", `${url}/increment`, b.token),
      await send("delete", url, b.token),
    ];

    for (const res of attempts) expectError(res, 404);

    const after = await getOne(a.token, original.anim_id);
    expect(after.status).toBe(200);
    expect(after.body.data).toEqual(original);
    expect(await countWatchlist()).toBe(1);
    expect((await send("get", ANIME, b.token)).body.data).toEqual([]);
  });
});

describe("katalog anime dibagi antar user", () => {
  it("user B melihat data katalog dari user A, tanpa menimpanya", async () => {
    const { a, b } = await twoUsers();

    const addedByA = await addAnime(a.token, {
      externalId: 777,
      title: "A",
      totalEps: 12,
      imgUrl: "https://cdn.example.com/a.jpg",
    });
    const addedByB = await addAnime(b.token, {
      externalId: 777,
      title: "B",
      totalEps: 24,
      imgUrl: "https://cdn.example.com/b.jpg",
    });

    expect(addedByB.anim_title).toBe("A");
    expect(addedByB.anim_total_episode).toBe(12);
    expect(addedByB.anim_img_url).toBe("https://cdn.example.com/a.jpg");
    expect(addedByB.us_id).toBe(b.user.id);
    expect(addedByB.anim_id).not.toBe(addedByA.anim_id);

    const readByA = await getOne(a.token, addedByA.anim_id);
    expect(readByA.body.data.anim_title).toBe("A");
    expect(await countCatalog()).toBe(1);
    expect(await countWatchlist()).toBe(2);
  });
});
