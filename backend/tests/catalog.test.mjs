import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./support/helpers.mjs";
import { clearCacheForTests } from "../src/services/anilist.service.mjs";

const CATALOG = "/api/catalog/anime";
const CACHE_TTL_MS = 5 * 60 * 1000;

let fetchMock;

// Fresh cache and a fresh fetch mock for every test. Supertest talks to the
// app over a local socket, so this mock only intercepts calls to AniList.
beforeEach(() => {
  clearCacheForTests();
  fetchMock = vi.fn(async () => {
    throw new Error("Panggilan AniList belum di-mock di tes ini.");
  });
  vi.stubGlobal("fetch", fetchMock);
});

const expectError = (res, status) => {
  expect(res.status).toBe(status);
  expect(res.body.status).toBe("error");
  expect(typeof res.body.message).toBe("string");
};

const jsonResponse = (body, { status = 200, headers = {} } = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const media = (id, overrides = {}) => ({
  id,
  title: {
    romaji: `Romaji ${id}`,
    english: `English ${id}`,
    native: `Native ${id}`,
  },
  episodes: 12,
  format: "TV",
  status: "FINISHED",
  averageScore: 85,
  coverImage: { large: `https://img.example.com/${id}.jpg` },
  ...overrides,
});

// A new Response per call, because a body can only be read once.
const mockPage = (items = [media(1)], hasNextPage = false) =>
  fetchMock.mockImplementation(async () =>
    jsonResponse({
      data: { Page: { pageInfo: { hasNextPage }, media: items } },
    }),
  );

const mockDetail = (detail) =>
  fetchMock.mockImplementation(async () =>
    jsonResponse({ data: { Media: detail } }),
  );

// The GraphQL payload (query + variables) sent to AniList in call n.
const sent = (n = 0) => JSON.parse(fetchMock.mock.calls[n][1].body);

describe("GET /api/catalog/anime: validasi query", () => {
  it.each([
    ["page 0", { page: "0" }],
    ["page 201", { page: "201" }],
    ["page bukan angka", { page: "abc" }],
    ["page 201 walau ada q", { q: "naruto", page: "201" }],
    ["filter tidak valid", { filter: "bogus" }],
    ["parameter asing", { foo: "bar" }],
    ["q lebih dari 100 karakter", { q: "x".repeat(101) }],
  ])("400: %s", async (_label, query) => {
    const res = await api().get(CATALOG).query(query);

    expectError(res, 400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("400: pesan untuk filter tidak valid", async () => {
    const res = await api().get(CATALOG).query({ filter: "bogus" });

    expectError(res, 400);
    expect(res.body.message).toContain("filter tidak valid");
  });

  it("400: daftar top (tanpa q) page 11 ditolak", async () => {
    const res = await api().get(CATALOG).query({ page: "11" });

    expectError(res, 400);
    expect(res.body.message).toContain(
      "Daftar top dibatasi maksimal 10 halaman",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("400: q kosong dianggap daftar top, page 11 ditolak", async () => {
    const res = await api().get(CATALOG).query({ q: "", page: "11" });

    expectError(res, 400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("200: daftar top page 10 diterima", async () => {
    mockPage();

    const res = await api().get(CATALOG).query({ page: "10" });

    expect(res.status).toBe(200);
  });

  it("200: dengan q, page 11 diterima", async () => {
    mockPage();

    const res = await api().get(CATALOG).query({ q: "naruto", page: "11" });

    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(11);
  });

  it("200: q tepat 100 karakter diterima", async () => {
    mockPage();

    const res = await api()
      .get(CATALOG)
      .query({ q: "x".repeat(100) });

    expect(res.status).toBe(200);
  });
});

describe("GET /api/catalog/anime: respons sukses", () => {
  it("200: data array apa adanya dan meta { page, perPage, hasNextPage }", async () => {
    const items = [media(1), media(2, { format: "MOVIE", episodes: 1 })];
    mockPage(items, false);

    const res = await api().get(CATALOG);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toEqual(items);
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: {
          romaji: expect.any(String),
          english: expect.any(String),
          native: expect.any(String),
        },
        episodes: expect.any(Number),
        format: expect.any(String),
        status: expect.any(String),
        averageScore: expect.any(Number),
        coverImage: { large: expect.any(String) },
      }),
    );
    expect(res.body.meta).toEqual({ page: 1, perPage: 48, hasNextPage: false });
  });

  it("200: page diteruskan ke AniList dan ke meta, perPage 48", async () => {
    mockPage();

    const res = await api().get(CATALOG).query({ page: "3" });

    expect(res.body.meta.page).toBe(3);
    expect(sent().variables).toMatchObject({ page: 3, perPage: 48 });
  });

  it.each([
    ["pencarian", { q: "naruto" }, true],
    ["pencarian", { q: "naruto" }, false],
    ["daftar top", {}, true],
    ["daftar top", {}, false],
  ])(
    "200: hasNextPage mengikuti AniList (%s, %j, %s)",
    async (_label, query, flag) => {
      mockPage([media(1)], flag);

      const res = await api().get(CATALOG).query(query);

      expect(res.status).toBe(200);
      expect(res.body.meta.hasNextPage).toBe(flag);
    },
  );
});

describe("GET /api/catalog/anime: pemetaan filter ke AniList", () => {
  it.each([
    ["all", { sort: ["SCORE_DESC"] }],
    ["airing", { status: "RELEASING", sort: ["SCORE_DESC"] }],
    ["upcoming", { status: "NOT_YET_RELEASED", sort: ["POPULARITY_DESC"] }],
    ["tv", { format: "TV", sort: ["SCORE_DESC"] }],
    ["movie", { format: "MOVIE", sort: ["SCORE_DESC"] }],
    ["ova", { format: "OVA", sort: ["SCORE_DESC"] }],
    ["ona", { format: "ONA", sort: ["SCORE_DESC"] }],
    ["special", { format: "SPECIAL", sort: ["SCORE_DESC"] }],
    ["popular", { sort: ["POPULARITY_DESC"] }],
    ["favorited", { sort: ["FAVOURITES_DESC"] }],
  ])("filter %s mengirim variabel yang benar", async (filter, expected) => {
    mockPage();

    const res = await api().get(CATALOG).query({ filter });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const { variables } = sent();
    expect(variables.sort).toEqual(expected.sort);
    expect(variables.status).toBe(expected.status);
    expect(variables.format).toBe(expected.format);
    expect(variables.search).toBeUndefined();
  });

  it("tanpa filter sama dengan filter all", async () => {
    mockPage();

    await api().get(CATALOG);

    const { variables } = sent();
    expect(variables.sort).toEqual(["SCORE_DESC"]);
    expect(variables.status).toBeUndefined();
    expect(variables.format).toBeUndefined();
  });

  it("daftar top mengecualikan konten dewasa", async () => {
    mockPage();

    await api().get(CATALOG).query({ filter: "tv" });

    expect(sent().query).toMatch(/isAdult:\s*false/);
  });

  it("jika q ada, filter diabaikan", async () => {
    mockPage();

    const res = await api()
      .get(CATALOG)
      .query({ q: "naruto", filter: "airing" });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const { variables } = sent();
    expect(variables.search).toBe("naruto");
    expect(variables.status).toBeUndefined();
    expect(variables.format).toBeUndefined();
    expect(variables.sort).toBeUndefined();
  });
});

describe("GET /api/catalog/anime: cache", () => {
  it("request yang sama dua kali memanggil AniList sekali", async () => {
    mockPage([media(1)]);

    const first = await api().get(CATALOG).query({ filter: "tv", page: "2" });
    const second = await api().get(CATALOG).query({ filter: "tv", page: "2" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.body).toEqual(first.body);
  });

  it("page berbeda memanggil AniList lagi", async () => {
    mockPage();

    await api().get(CATALOG).query({ page: "1" });
    await api().get(CATALOG).query({ page: "2" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("filter berbeda memanggil AniList lagi", async () => {
    mockPage();

    await api().get(CATALOG).query({ filter: "tv" });
    await api().get(CATALOG).query({ filter: "movie" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("q berbeda memanggil AniList lagi", async () => {
    mockPage();

    await api().get(CATALOG).query({ q: "naruto" });
    await api().get(CATALOG).query({ q: "bleach" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("q beda huruf besar/kecil memakai cache yang sama", async () => {
    mockPage();

    await api().get(CATALOG).query({ q: "Naruto" });
    await api().get(CATALOG).query({ q: "naruto" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("detail anime yang sama dua kali memanggil AniList sekali", async () => {
    mockDetail({ id: 1535, title: { romaji: "Death Note" } });

    await api().get(`${CATALOG}/1535`);
    await api().get(`${CATALOG}/1535`);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("cache kedaluwarsa setelah 5 menit", async () => {
    mockPage();
    const start = Date.now();
    const nowSpy = vi.spyOn(Date, "now");

    try {
      await api().get(CATALOG);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      nowSpy.mockReturnValue(start + CACHE_TTL_MS + 1000);
      await api().get(CATALOG);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      nowSpy.mockRestore();
    }
  });
});

describe("error dari AniList", () => {
  const endpoints = [
    ["pencarian", () => api().get(CATALOG).query({ q: "naruto" })],
    ["daftar top", () => api().get(CATALOG)],
    ["detail", () => api().get(`${CATALOG}/1535`)],
  ];

  describe.each(endpoints)("%s", (_name, call) => {
    it("429 dari AniList menjadi 429", async () => {
      fetchMock.mockImplementation(async () =>
        jsonResponse(
          { errors: [{ message: "Too Many Requests." }] },
          { status: 429, headers: { "Retry-After": "30" } },
        ),
      );

      expectError(await call(), 429);
    });

    it("gangguan jaringan menjadi 502", async () => {
      fetchMock.mockRejectedValue(new TypeError("fetch failed"));

      expectError(await call(), 502);
    });

    it("timeout menjadi 504 (disimulasikan, tanpa menunggu 10 detik)", async () => {
      fetchMock.mockRejectedValue(
        new DOMException("The operation timed out.", "TimeoutError"),
      );

      expectError(await call(), 504);
    });
  });

  it("429 memuat waktu tunggu dari Retry-After", async () => {
    fetchMock.mockImplementation(async () =>
      jsonResponse(
        { errors: [{ message: "Too Many Requests." }] },
        { status: 429, headers: { "Retry-After": "30" } },
      ),
    );

    const res = await api().get(CATALOG).query({ q: "naruto" });

    expectError(res, 429);
    expect(res.body.message).toContain("30");
  });
});

describe("GET /api/catalog/anime/:id", () => {
  it.each(["abc", "0", "-1"])(
    "400: id %s tidak valid, AniList tidak dipanggil",
    async (id) => {
      const res = await api().get(`${CATALOG}/${id}`);

      expectError(res, 400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("404: anime tidak ditemukan di AniList", async () => {
    fetchMock.mockImplementation(async () =>
      jsonResponse(
        {
          data: { Media: null },
          errors: [{ message: "Not Found.", status: 404 }],
        },
        { status: 404 },
      ),
    );

    const res = await api().get(`${CATALOG}/999999999`);

    expectError(res, 404);
  });

  it("200: detail sukses diteruskan apa adanya, id dikirim sebagai angka", async () => {
    const detail = {
      id: 1535,
      title: {
        romaji: "Death Note",
        english: "Death Note",
        native: "デスノート",
      },
      description: "<p>Deskripsi</p>",
      episodes: 37,
      genres: ["Mystery", "Thriller"],
    };
    mockDetail(detail);

    const res = await api().get(`${CATALOG}/1535`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toEqual(detail);
    expect(sent().variables.id).toBe(1535);
  });
});
