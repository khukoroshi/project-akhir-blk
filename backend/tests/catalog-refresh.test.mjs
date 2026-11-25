import { afterEach, describe, expect, it, vi } from "vitest";
import db from "../src/config/db.mjs";
import { getAnimeBatches } from "../src/integrations/anilist/index.mjs";
import { refreshCatalog } from "../src/modules/anime/index.mjs";
import { makeMedia, stubAniListDetail } from "./support/anilist.mjs";
import { api, createUserAndLogin, withSession } from "./support/helpers.mjs";

afterEach(() => vi.unstubAllGlobals());

const jsonResponse = (body, { status = 200, headers = {} } = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

// Stubs fetch for the AniList batch query. Ids in `missing` are not returned.
const stubBatch = ({ missing = [] } = {}) => {
  const overrides = new Map();
  const calls = []; // the ids array of each request that was answered
  const fetchMock = vi.fn(async (_url, init) => {
    const { variables } = JSON.parse(init.body);
    calls.push(variables.ids);
    const media = variables.ids
      .filter((id) => !missing.includes(id))
      .map((id) => overrides.get(id) ?? makeMedia(id));
    return jsonResponse({ data: { Page: { media } } });
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    fetchMock,
    calls,
    override: (id, media) => overrides.set(id, media),
  };
};

const tooMany = (retryAfter = "3") =>
  jsonResponse(
    { errors: [{ message: "Too Many Requests." }] },
    { status: 429, headers: { "Retry-After": retryAfter } },
  );

const collect = async (iterator) => {
  const out = [];
  for await (const item of iterator) out.push(item);
  return out;
};

const seedCatalog = (
  externalId,
  { title = `Anime ${externalId}`, cover = "https://old.example.com/x.jpg", episodes = 1, type = "OVA" } = {},
) =>
  db.execute(
    `INSERT INTO anime_catalog
       (external_id, source, title, cover_image, total_episodes, anim_type, synced_at)
     VALUES (?, 'anilist', ?, ?, ?, ?, NULL)`,
    [externalId, title, cover, episodes, type],
  );

const catalogRow = async (externalId) => {
  const [[row]] = await db.query(
    "SELECT * FROM anime_catalog WHERE external_id = ?",
    [externalId],
  );
  return row;
};

const quiet = () => ({ log: () => {}, sleep: async () => {} });

describe("getAnimeBatches", () => {
  it("memecah 120 id menjadi 3 permintaan (50, 50, 20) dengan jeda 2,5 detik", async () => {
    const batch = stubBatch();
    const sleep = vi.fn(async () => {});
    const ids = Array.from({ length: 120 }, (_, i) => i + 1);

    const results = await collect(getAnimeBatches(ids, { sleep }));

    expect(batch.calls.map((c) => c.length)).toEqual([50, 50, 20]);
    expect(batch.calls.flat()).toEqual(ids);
    expect(results.map((r) => r.media.length)).toEqual([50, 50, 20]);
    expect(sleep.mock.calls).toEqual([[2500], [2500]]);
    const sent = JSON.parse(batch.fetchMock.mock.calls[0][1].body);
    expect(sent.variables).toMatchObject({ page: 1, perPage: 50 });
    expect(sent.query).toContain("id_in");
  });

  it("tepat 50 id: satu permintaan, tanpa jeda", async () => {
    const batch = stubBatch();
    const sleep = vi.fn(async () => {});

    await collect(
      getAnimeBatches(Array.from({ length: 50 }, (_, i) => i + 1), { sleep }),
    );

    expect(batch.calls).toHaveLength(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("id yang tidak ditemukan tidak ada di media", async () => {
    stubBatch({ missing: [2] });

    const [result] = await collect(
      getAnimeBatches([1, 2, 3], { sleep: async () => {} }),
    );

    expect(result.error).toBeUndefined();
    expect(result.ids).toEqual([1, 2, 3]);
    expect(result.media.map((m) => m.id)).toEqual([1, 3]);
  });

  it("429 lalu sukses: menunggu Retry-After dan mengulang", async () => {
    const batch = stubBatch();
    batch.fetchMock.mockImplementationOnce(async () => tooMany("3"));
    const sleep = vi.fn(async () => {});

    const [result] = await collect(getAnimeBatches([1, 2], { sleep }));

    expect(result.error).toBeUndefined();
    expect(result.media).toHaveLength(2);
    expect(batch.fetchMock).toHaveBeenCalledTimes(2);
    expect(sleep.mock.calls).toEqual([[3000]]);
  });

  it("429 terus-menerus: berhenti setelah maxRetries dan melaporkan error", async () => {
    const batch = stubBatch();
    batch.fetchMock.mockImplementation(async () => tooMany("1"));
    const sleep = vi.fn(async () => {});

    const [result] = await collect(
      getAnimeBatches([1], { sleep, maxRetries: 2 }),
    );

    expect(result.error.statusCode).toBe(429);
    expect(batch.fetchMock).toHaveBeenCalledTimes(3); // 1 awal + 2 ulang
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("batch yang gagal tidak menghentikan batch berikutnya", async () => {
    const batch = stubBatch();
    batch.fetchMock.mockImplementationOnce(async () => {
      throw new TypeError("fetch failed");
    });
    const ids = Array.from({ length: 51 }, (_, i) => i + 1);

    const results = await collect(
      getAnimeBatches(ids, { sleep: async () => {} }),
    );

    expect(results[0].error.statusCode).toBe(502);
    expect(results[1].media).toHaveLength(1);
  });
});

describe("refreshCatalog", () => {
  it("memperbarui judul (romaji), gambar, episode, tipe, dan synced_at", async () => {
    await seedCatalog(5);
    stubBatch();

    const summary = await refreshCatalog(quiet());

    expect(summary).toMatchObject({ total: 1, updated: 1, unchanged: 0, notFound: 0, failed: 0 });
    const row = await catalogRow(5);
    expect(row).toMatchObject({
      title: "Romaji 5",
      cover_image: "https://img.example.com/5-large.jpg",
      total_episodes: 12,
      anim_type: "TV",
    });
    expect(row.synced_at).not.toBeNull();
  });

  it("idempotent: jalan kedua tidak mengubah apa pun", async () => {
    await seedCatalog(5);
    stubBatch();

    await refreshCatalog(quiet());
    const second = await refreshCatalog(quiet());

    expect(second).toMatchObject({ updated: 0, unchanged: 1, notFound: 0, failed: 0 });
    expect((await catalogRow(5)).title).toBe("Romaji 5");
  });

  it("baris yang tidak ditemukan di AniList tidak disentuh dan dihitung", async () => {
    await seedCatalog(1);
    await seedCatalog(2, {
      title: "Romaji 2",
      cover: "https://img.example.com/2-large.jpg",
      episodes: 12,
      type: "TV",
    });
    await seedCatalog(3);
    stubBatch({ missing: [3] });
    const untouched = await catalogRow(3);

    const summary = await refreshCatalog(quiet());

    expect(summary).toMatchObject({ total: 3, updated: 1, unchanged: 1, notFound: 1, failed: 0 });
    expect(await catalogRow(3)).toEqual(untouched);
  });

  it("dry-run: melaporkan tetapi tidak menulis", async () => {
    await seedCatalog(5);
    const batch = stubBatch();
    const before = await catalogRow(5);

    const summary = await refreshCatalog({ ...quiet(), dryRun: true });

    expect(summary).toMatchObject({ dryRun: true, updated: 1, failed: 0 });
    expect(batch.calls).toHaveLength(1); // AniList tetap dibaca
    expect(await catalogRow(5)).toEqual(before);
  });

  it("batch gagal dihitung sebagai gagal dan baris tidak berubah", async () => {
    await seedCatalog(5);
    const batch = stubBatch();
    batch.fetchMock.mockImplementation(async () => {
      throw new TypeError("fetch failed");
    });
    const before = await catalogRow(5);

    const summary = await refreshCatalog(quiet());

    expect(summary).toMatchObject({ updated: 0, failed: 1 });
    expect(await catalogRow(5)).toEqual(before);
  });

  it("429 diulang lalu data tetap diperbarui", async () => {
    await seedCatalog(5);
    const batch = stubBatch();
    batch.fetchMock.mockImplementationOnce(async () => tooMany("2"));

    const summary = await refreshCatalog(quiet());

    expect(summary).toMatchObject({ updated: 1, failed: 0 });
    expect((await catalogRow(5)).title).toBe("Romaji 5");
  });

  it("GET /api/anime memuat anim_title romaji untuk data lama", async () => {
    const detail = stubAniListDetail();
    const media = makeMedia(1535, {
      title: { romaji: "Desu Nōto", english: "Death Note", native: null },
    });
    detail.set(1535, media);
    const { token } = await createUserAndLogin();
    const added = await withSession(api().post("/api/anime"), token).send({
      externalId: 1535,
    });
    expect(added.status).toBe(201);
    expect(added.body.data.anim_title).toBe("Desu Nōto");

    // Simulate old data: the catalog still holds the english title.
    await db.query(
      "UPDATE anime_catalog SET title = 'Death Note' WHERE external_id = 1535",
    );
    const batch = stubBatch();
    batch.override(1535, media);

    await refreshCatalog(quiet());

    const res = await withSession(api().get("/api/anime"), token);
    expect(res.status).toBe(200);
    expect(res.body.data[0].anim_title).toBe("Desu Nōto");
  });
});