import { vi } from "vitest";
import { clearCacheForTests } from "../../src/services/anilist.service.mjs";

export const makeMedia = (id, overrides = {}) => ({
  id,
  title: {
    romaji: `Romaji ${id}`,
    english: `Anime ${id}`,
    native: `Native ${id}`,
  },
  description: null,
  episodes: 12,
  duration: 24,
  format: "TV",
  status: "FINISHED",
  averageScore: 80,
  genres: [],
  coverImage: {
    large: `https://img.example.com/${id}-large.jpg`,
    extraLarge: `https://img.example.com/${id}-xl.jpg`,
  },
  bannerImage: null,
  startDate: { year: 2020, month: 1, day: 1 },
  endDate: { year: 2020, month: 3, day: 1 },
  ...overrides,
});

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// Stubs global fetch for AniList detail queries and clears the AniList cache.
// anilist.set(id, media | "down" | "not-found") changes what AniList answers.
// anilist.calls lists every id that was requested (cache hits do not count).
export const stubAniListDetail = () => {
  clearCacheForTests();
  const registry = new Map();
  const calls = [];

  const fetchMock = vi.fn(async (_url, init) => {
    const { variables } = JSON.parse(init.body);
    const id = variables?.id;
    if (!Number.isInteger(id)) {
      throw new Error("Stub only supports the AniList detail query");
    }
    calls.push(id);

    const entry = registry.has(id) ? registry.get(id) : makeMedia(id);
    if (entry === "down") throw new TypeError("fetch failed");
    if (entry === "not-found") {
      return json({ errors: [{ message: "Not Found." }] }, 404);
    }
    return json({ data: { Media: entry } });
  });

  vi.stubGlobal("fetch", fetchMock);

  return {
    calls,
    set: (id, entry) => registry.set(id, entry),
    clearCache: clearCacheForTests,
  };
};
