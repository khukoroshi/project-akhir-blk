import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { api } from "./support/helpers.mjs";
import { createApp } from "../src/app.mjs";
import { clearCacheForTests } from "../src/integrations/anilist/index.mjs";

// Same shape as tests/rateLimit.test.mjs. The limiter is off by default in
// tests, so this builds an app with it on and a tiny catalog limit.
const buildLimitedApp = (catalogMax) =>
  request(
    createApp({
      rateLimit: {
        enabled: true,
        limits: {
          global: { limit: 1000, windowMs: 15 * MINUTE },
          loginEmail: { limit: 1000, windowMs: 15 * MINUTE },
          loginIp: { limit: 1000, windowMs: 15 * MINUTE },
          register: { limit: 1000, windowMs: 60 * MINUTE },
          catalog: { limit: catalogMax, windowMs: MINUTE },
          createAnime: { limit: 1000, windowMs: 15 * MINUTE },
          profileUpdate: { limit: 1000, windowMs: 15 * MINUTE },
        },
      },
    }),
  );

const CATALOG = "/api/catalog/anime";
const FEATURED = `${CATALOG}/featured`;
const MINUTE = 60 * 1000;

let fetchMock;

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

const featuredMedia = (id, overrides = {}) => ({
  id,
  title: {
    romaji: `Romaji ${id}`,
    english: `English ${id}`,
    native: `Native ${id}`,
  },
  bannerImage: `https://img.example.com/${id}-banner.jpg`,
  coverImage: {
    extraLarge: `https://img.example.com/${id}-xl.jpg`,
    large: `https://img.example.com/${id}-large.jpg`,
    color: "#e4a15d",
  },
  format: "TV",
  episodes: 12,
  status: "RELEASING",
  averageScore: 80,
  genres: ["Action", "Drama", "Fantasy", "Mystery"],
  season: "FALL",
  seasonYear: 2026,
  description: "Deskripsi",
  ...overrides,
});

const noBanner = (id, overrides = {}) =>
  featuredMedia(id, { bannerImage: null, ...overrides });

const noImages = (id) =>
  noBanner(id, {
    coverImage: {
      extraLarge: null,
      large: "https://img.example.com/x.jpg",
      color: null,
    },
  });

const mockMedia = (items) =>
  fetchMock.mockImplementation(async () =>
    jsonResponse({ data: { Page: { media: items } } }),
  );

const mockPage = (items) =>
  fetchMock.mockImplementation(async () =>
    jsonResponse({
      data: { Page: { pageInfo: { hasNextPage: false }, media: items } },
    }),
  );

const sent = (n = 0) => JSON.parse(fetchMock.mock.calls[n][1].body);

const range = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe("GET /api/catalog/anime/featured: pemilihan item", () => {
  it("200: maksimal 8 item dari 16 yang diminta, urutan dipertahankan", async () => {
    mockMedia(range(1, 16).map((id) => featuredMedia(id)));

    const res = await api().get(FEATURED);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.map((i) => i.id)).toEqual(range(1, 8));
  });

  it("meminta AniList dengan status RELEASING, TRENDING_DESC, bukan dewasa, 16 item", async () => {
    mockMedia([featuredMedia(1)]);

    await api().get(FEATURED);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const { query, variables } = sent();
    expect(query).toMatch(/type:\s*ANIME/);
    expect(query).toMatch(/status:\s*RELEASING/);
    expect(query).toMatch(/sort:\s*TRENDING_DESC/);
    expect(query).toMatch(/isAdult:\s*false/);
    expect(variables).toEqual({ perPage: 16 });
  });

  it("membuang item tanpa banner jika banner cukup (6 dari 16)", async () => {
    mockMedia([
      ...range(1, 6).map((id) => featuredMedia(id)),
      ...range(7, 16).map((id) => noBanner(id)),
    ]);

    const res = await api().get(FEATURED);

    expect(res.body.data.map((i) => i.id)).toEqual(range(1, 6));
    expect(res.body.data.every((i) => i.bannerImage)).toBe(true);
  });

  it("tepat 5 banner: tidak diisi sampul", async () => {
    mockMedia([
      ...range(1, 5).map((id) => featuredMedia(id)),
      ...range(6, 16).map((id) => noBanner(id)),
    ]);

    const res = await api().get(FEATURED);

    expect(res.body.data.map((i) => i.id)).toEqual(range(1, 5));
  });

  it("kurang dari 5 banner: diisi item ber-sampul extraLarge sampai 8", async () => {
    mockMedia([
      ...range(1, 3).map((id) => featuredMedia(id)),
      ...range(4, 13).map((id) => noBanner(id)),
      noImages(14),
      noImages(15),
    ]);

    const res = await api().get(FEATURED);

    expect(res.body.data.map((i) => i.id)).toEqual(range(1, 8));
    expect(res.body.data.slice(0, 3).every((i) => i.bannerImage)).toBe(true);
    for (const item of res.body.data.slice(3)) {
      expect(item.bannerImage).toBeNull();
      expect(item.coverImage.extraLarge).toEqual(expect.any(String));
    }
  });

  it("pengisi tanpa extraLarge tidak ikut", async () => {
    mockMedia([featuredMedia(1), featuredMedia(2), noBanner(3), noImages(4)]);

    const res = await api().get(FEATURED);

    expect(res.body.data.map((i) => i.id)).toEqual([1, 2, 3]);
  });

  it("200: AniList tanpa hasil menghasilkan data kosong", async () => {
    mockMedia([]);

    const res = await api().get(FEATURED);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("GET /api/catalog/anime/featured: bentuk item", () => {
  it("memuat tepat field yang dijanjikan, genres maks 3", async () => {
    mockMedia([featuredMedia(1, { popularity: 999, siteUrl: "x" })]);

    const res = await api().get(FEATURED);

    expect(res.body.data[0]).toEqual({
      id: 1,
      title: { romaji: "Romaji 1", english: "English 1", native: "Native 1" },
      bannerImage: "https://img.example.com/1-banner.jpg",
      coverImage: {
        extraLarge: "https://img.example.com/1-xl.jpg",
        large: "https://img.example.com/1-large.jpg",
        color: "#e4a15d",
      },
      format: "TV",
      episodes: 12,
      status: "RELEASING",
      averageScore: 80,
      genres: ["Action", "Drama", "Fantasy"],
      season: "FALL",
      seasonYear: 2026,
      description: "Deskripsi",
    });
  });
});

describe("GET /api/catalog/anime/featured: description teks biasa", () => {
  const descriptionOf = async (raw) => {
    mockMedia([featuredMedia(1, { description: raw })]);
    const res = await api().get(FEATURED);
    expect(res.status).toBe(200);
    return res.body.data[0].description;
  };

  it("<br> menjadi spasi dan tag dihapus", async () => {
    expect(
      await descriptionOf("Satu<br>dua<br /><i>miring</i> <b>tebal</b>akhir"),
    ).toBe("Satu dua miring tebalakhir");
  });

  it("entitas dasar didecode", async () => {
    expect(
      await descriptionOf("Tom &amp; Jerry &quot;x&quot; it&#039;s &lt;b&gt;"),
    ).toBe(`Tom & Jerry "x" it's <b>`);
  });

  it("&amp;lt; menjadi &lt; (tidak didecode dua kali)", async () => {
    expect(await descriptionOf("a &amp;lt; b")).toBe("a &lt; b");
  });

  it("spasi dirapikan", async () => {
    expect(await descriptionOf("  a \n\n  b\t c  ")).toBe("a b c");
  });

  it("kosong atau hanya tag menjadi null", async () => {
    expect(await descriptionOf(null)).toBeNull();
  });

  it("panjang tepat 220 tidak dipotong", async () => {
    const text = "a".repeat(220);
    expect(await descriptionOf(text)).toBe(text);
  });

  it("lebih dari 220 dipotong di batas kata, total maks 220, diakhiri ...", async () => {
    const result = await descriptionOf("word ".repeat(100));

    expect(result.length).toBeLessThanOrEqual(220);
    expect(result).toMatch(/^(word )*word\.\.\.$/);
  });

  it("tanpa spasi: dipotong keras, tetap 220 karakter", async () => {
    const result = await descriptionOf("a".repeat(500));

    expect(result).toHaveLength(220);
    expect(result.endsWith("...")).toBe(true);
  });
});

describe("GET /api/catalog/anime/featured: validasi dan rute", () => {
  it.each([
    ["parameter asing", { foo: "bar" }],
    ["page", { page: "1" }],
    ["q", { q: "naruto" }],
    ["filter", { filter: "tv" }],
  ])("400: %s ditolak, AniList tidak dipanggil", async (_label, query) => {
    const res = await api().get(FEATURED).query(query);

    expectError(res, 400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("'featured' tidak dianggap :id", async () => {
    mockMedia([featuredMedia(1)]);

    const res = await api().get(FEATURED);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sent().variables.id).toBeUndefined();
  });

  it("/catalog/anime/:id tetap berfungsi (id tidak valid tetap 400)", async () => {
    const res = await api().get(`${CATALOG}/abc`);

    expectError(res, 400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/catalog/anime/featured: cache 30 menit", () => {
  it("panggilan kedua tidak menghubungi AniList", async () => {
    mockMedia([featuredMedia(1)]);

    const first = await api().get(FEATURED);
    const second = await api().get(FEATURED);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second.body).toEqual(first.body);
  });

  it("masih cache di menit ke-29, kedaluwarsa setelah 30 menit", async () => {
    mockMedia([featuredMedia(1)]);
    const start = Date.now();
    const nowSpy = vi.spyOn(Date, "now");

    try {
      await api().get(FEATURED);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      nowSpy.mockReturnValue(start + 29 * MINUTE);
      await api().get(FEATURED);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      nowSpy.mockReturnValue(start + 30 * MINUTE + 1000);
      await api().get(FEATURED);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it("terpisah dari cache daftar", async () => {
    mockPage([featuredMedia(1)]);
    await api().get(CATALOG);
    await api().get(FEATURED);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("GET /api/catalog/anime/featured: error dari AniList", () => {
  it("429 diteruskan dan memuat waktu tunggu", async () => {
    fetchMock.mockImplementation(async () =>
      jsonResponse(
        { errors: [{ message: "Too Many Requests." }] },
        { status: 429, headers: { "Retry-After": "30" } },
      ),
    );

    const res = await api().get(FEATURED);

    expectError(res, 429);
    expect(res.body.message).toContain("30");
  });

  it("gangguan jaringan menjadi 502", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    expectError(await api().get(FEATURED), 502);
  });

  it("timeout menjadi 504", async () => {
    fetchMock.mockRejectedValue(
      new DOMException("The operation timed out.", "TimeoutError"),
    );

    expectError(await api().get(FEATURED), 504);
  });

  it("status 500 dari AniList menjadi 502", async () => {
    fetchMock.mockImplementation(async () =>
      jsonResponse({ errors: [{ message: "Boom" }] }, { status: 500 }),
    );

    expectError(await api().get(FEATURED), 502);
  });

  it("error tidak disimpan di cache", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expectError(await api().get(FEATURED), 502);

    mockMedia([featuredMedia(1)]);
    const res = await api().get(FEATURED);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("GET /api/catalog/anime/featured: pembatas laju katalog", () => {
  it("429 + Retry-After setelah batas terlampaui", async () => {
    mockMedia([featuredMedia(1)]);
    const server = buildLimitedApp(2);

    expect((await server.get(FEATURED)).status).toBe(200);
    expect((await server.get(FEATURED)).status).toBe(200);
    const res = await server.get(FEATURED);

    expectError(res, 429);
    expect(res.body.message).toMatch(/menit/);
    expect(Number(res.headers["retry-after"])).toBeGreaterThan(0);
    expect(res.headers["ratelimit-limit"]).toBeDefined();
    // Cache means AniList is only contacted once.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("batas dibagi dengan daftar dan detail", async () => {
    mockMedia([featuredMedia(1)]);
    const server = buildLimitedApp(2);

    expect((await server.get(`${CATALOG}/abc`)).status).toBe(400);
    expect((await server.get(`${CATALOG}?page=0`)).status).toBe(400);
    expectError(await server.get(FEATURED), 429);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/catalog/anime: field baru di daftar", () => {
  const withExtras = (id) => ({
    id,
    title: { romaji: "R", english: "E", native: "N" },
    episodes: 12,
    format: "TV",
    status: "FINISHED",
    averageScore: 85,
    coverImage: { large: "https://img.example.com/x.jpg" },
    genres: ["Action", "Drama", "Fantasy", "Mystery"],
    season: "WINTER",
    seasonYear: 2026,
  });

  it.each([
    ["daftar top", {}],
    ["pencarian", { q: "naruto" }],
  ])("%s: genres maks 3, season, seasonYear; meta tetap", async (_l, query) => {
    mockPage([withExtras(1)]);

    const res = await api().get(CATALOG).query(query);

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toEqual({
      ...withExtras(1),
      genres: ["Action", "Drama", "Fantasy"],
    });
    expect(res.body.meta).toEqual({ page: 1, perPage: 48, hasNextPage: false });
    const { query: gql } = sent();
    expect(gql).toMatch(/\bgenres\b/);
    expect(gql).toMatch(/\bseason\b/);
    expect(gql).toMatch(/\bseasonYear\b/);
  });

  it("genres kurang dari 3 dikembalikan apa adanya", async () => {
    mockPage([{ ...withExtras(1), genres: ["Action"] }]);

    const res = await api().get(CATALOG);

    expect(res.body.data[0].genres).toEqual(["Action"]);
  });
});
