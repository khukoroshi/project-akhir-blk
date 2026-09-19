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
  // const [query, setQuery] = useState("");
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

  // if (loading) {
  //   return <LoadingPage />;
  // }

  // if (error) {
  //   return <ErrorApiPage error={error} />;
  // }

  return (
    <MainLayout username={user?.name}>
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-4 text-3xl font-bold">Welcome</h1>

        {user && <p className="mb-4 text-gray-600">Halo, {user.name}!</p>}

        <p className="mb-4 text-gray-600">This is your React starter kit.</p>

        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Cari Anime..."
          className="rounded border p-2"
        />

        <Button
          onClick={() => setQuery(searchInput.trim())}
          variant="secondary"
          className="ml-2 rounded px-4 py-2"
        >
          Search
        </Button>

        {loading ? (
          <LoadingPage />
        ) : error ? (
          <ErrorApiPage error={error} />
        ) : (
          <DaftarAnime animeList={animeList} />
        )}
      </div>
    </MainLayout>
  );
}

export default Home;
