import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

import MainLayout from "../layouts/MainLayout";
import Button from "../components/common/Button";
import LoadingPage from "../components/common/LoadingPage";
import ErrorApiPage from "../components/common/ErrorApiPage";
import DaftarAnime from "../components/common/DaftarAnime";

function Home() {
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const fetchAnime = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/catalog/anime", {
          params: query ? { q: query } : {},
        });

        setAnimeList(response.data.data || []);
      } catch (err) {
        console.error("Gagal mengambil data:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Gagal mengambil data anime",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnime();
  }, [query]);

  return (
    <MainLayout username={user?.name}>
      <div className="space-y-10">
        {/* HERO / SEARCH */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 shadow-sm sm:px-10">
          {/* Decorative circles */}

          <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-40 left-20 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative max-w-3xl">
            {/* Label */}

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              Anime Catalog
            </div>

            {/* Heading */}

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Discover your next
              <span className="text-indigo-400"> favorite anime.</span>
            </h1>

            {/* Description */}

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Search, discover, and keep track of the anime you want to watch.
              Build your own personal anime collection.
            </p>

            {/* Search */}

            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                {/* Search icon */}

                <svg
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />

                  <path strokeLinecap="round" d="m20 20-4-4" />
                </svg>

                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setQuery(searchInput.trim());
                    }
                  }}
                  placeholder="Search anime..."
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-400 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>

              <Button
                onClick={() => setQuery(searchInput.trim())}
                variant="secondary"
                className="h-12 rounded-xl bg-white px-6 font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Search
              </Button>
            </div>
          </div>
        </section>

        {/* CATALOG */}

        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {query ? "Search Result" : "Explore"}
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {query ? `Results for "${query}"` : "Top Anime"}
              </h2>
            </div>

            {!query && (
              <p className="hidden text-sm text-slate-400 dark:text-slate-500 sm:block">
                Popular anime
              </p>
            )}
          </div>

          {/* API STATE */}

          {loading ? (
            <LoadingPage />
          ) : error ? (
            <ErrorApiPage error={error} />
          ) : animeList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                Anime tidak ditemukan
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Coba gunakan kata kunci pencarian yang lain.
              </p>
            </div>
          ) : (
            <DaftarAnime animeList={animeList} />
          )}
        </section>
      </div>
    </MainLayout>
  );
}

export default Home;
