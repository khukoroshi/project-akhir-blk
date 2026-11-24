import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

import MainLayout from "../layouts/MainLayout";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import ErrorApiPage from "../components/common/ErrorApiPage";
import DaftarAnime from "../components/common/DaftarAnime";
import AnimeGridSkeleton from "../components/common/AnimeGridSkeleton";
import Pagination from "../components/common/Pagination";
import FilterTabs from "../components/common/FilterTabs";
import { ListVideo, Search } from "../components/common/icons";
import { CATALOG_FILTERS } from "../utils/catalogFilters";

function Home() {
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const { user } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();

  const rawPage = Number(searchParams.get("page"));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const rawFilter = searchParams.get("filter");
  const activeFilter =
    CATALOG_FILTERS.find((f) => f.key === rawFilter) ?? CATALOG_FILTERS[0];
  const filter = activeFilter.key; // invalid values fall back to "all"

  const goToPage = (nextPage) => {
    const params = {};
    if (query) params.q = query;
    else if (filter !== "all") params.filter = filter;
    if (nextPage > 1) params.page = String(nextPage);

    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    let ignore = false;

    const fetchAnime = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/catalog/anime", {
          params: query
            ? { q: query, page }
            : { page, ...(filter !== "all" && { filter }) },
        });

        if (ignore) return;
        setAnimeList(response.data.data || []);
        setHasNextPage(response.data.meta?.hasNextPage ?? false);
      } catch (err) {
        if (ignore) return;
        console.error("Gagal mengambil data:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Gagal mengambil data anime",
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchAnime();

    return () => {
      ignore = true;
    };
  }, [query, page, filter]);

  const showPagination = !loading && !error && animeList.length > 0;
  const ResultIcon = query ? Search : ListVideo;

  return (
    <MainLayout username={user?.name}>
      <div className="space-y-6">
        {/* HERO */}
        <section className="rounded-md border border-border bg-subtle p-5 sm:p-8">
          <Badge tone="accent">Katalog Anime</Badge>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-fg sm:text-4xl">
            Temukan{" "}
            <span className="text-accent">anime favorit berikutnya.</span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Cari lewat kolom di header, jelajahi kategori, dan simpan anime yang
            ingin kamu tonton ke daftar pribadimu.
          </p>

          <FilterTabs
            className="mt-6"
            activeKey={query ? null : filter}
            query={query}
          />
        </section>

        {/* RESULTS BAR + CONTENT */}
        <section className="space-y-5">
          <div className="flex flex-col gap-3 rounded-md border border-border bg-subtle p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-canvas text-accent">
                <ResultIcon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {query ? "Hasil pencarian" : "Jelajahi"}
                </p>
                <h2 className="truncate text-lg font-semibold text-fg">
                  {query ? `Hasil untuk “${query}”` : activeFilter.title}
                </h2>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* D3C: tombol tampilan grid/daftar ditaruh di sini */}
              {showPagination && (
                <Pagination
                  page={page}
                  hasNextPage={hasNextPage}
                  onPageChange={goToPage}
                  className="w-full justify-between sm:w-auto sm:justify-end"
                  label="Pagination atas"
                />
              )}
            </div>
          </div>

          {loading ? (
            <AnimeGridSkeleton />
          ) : error ? (
            <ErrorApiPage error={error} />
          ) : animeList.length === 0 ? (
            <Card className="px-6 py-16 text-center">
              <p className="text-lg font-semibold text-fg">
                Anime tidak ditemukan
              </p>
              <p className="mt-2 text-sm text-muted">
                Coba gunakan kata kunci pencarian yang lain.
              </p>
            </Card>
          ) : (
            <DaftarAnime animeList={animeList} />
          )}

          {showPagination && (
            <Pagination
              page={page}
              hasNextPage={hasNextPage}
              onPageChange={goToPage}
              label="Pagination bawah"
              announce={false}
            />
          )}
        </section>
      </div>
    </MainLayout>
  );
}

export default Home;
