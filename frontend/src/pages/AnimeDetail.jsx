import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

function AnimeDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnimeDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/catalog/anime/${id}`);

        setAnime(response.data.data);
      } catch (err) {
        console.error("Gagal mengambil detail anime:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Gagal mengambil detail anime",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeDetail();
  }, [id]);

  if (loading) {
    return (
      <MainLayout username={user?.name}>
        <p>Loading...</p>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout username={user?.name}>
        <div>
          <p>{error}</p>

          <Link to="/">Kembali ke Home</Link>
        </div>
      </MainLayout>
    );
  }

  if (!anime) {
    return (
      <MainLayout username={user?.name}>
        <p>Anime tidak ditemukan.</p>
      </MainLayout>
    );
  }

  const title =
    anime.title?.english ||
    anime.title?.romaji ||
    anime.title?.native ||
    "Unknown";

  return (
    <MainLayout username={user?.name}>
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 md:grid-cols-[250px_1fr]">
          {/* Poster */}
          <div>
            <img
              src={anime.coverImage?.extraLarge || anime.coverImage?.large}
              alt={title}
              className="w-full rounded-lg"
            />
          </div>

          {/* Information */}
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>

            {anime.title?.romaji && anime.title.romaji !== title && (
              <p className="mt-1 text-gray-500">{anime.title.romaji}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {anime.genres?.map((genre) => (
                <span
                  key={genre}
                  className="rounded bg-gray-200 px-3 py-1 text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div>
                <span className="font-semibold">Score</span>

                <p>⭐ {anime.averageScore ?? "N/A"}/100</p>
              </div>

              <div>
                <span className="font-semibold">Episodes</span>

                <p>{anime.episodes ?? "Unknown"}</p>
              </div>

              <div>
                <span className="font-semibold">Format</span>

                <p>{anime.format ?? "Unknown"}</p>
              </div>

              <div>
                <span className="font-semibold">Status</span>

                <p>{anime.status ?? "Unknown"}</p>
              </div>

              <div>
                <span className="font-semibold">Duration</span>

                <p>
                  {anime.duration ? `${anime.duration} minutes` : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold">Synopsis</h2>

          <p className="mt-3 leading-7 text-gray-700">
            {anime.description || "Tidak ada synopsis."}
          </p>
        </div>

        <div className="mt-6">
          <Link to="/" className="rounded bg-gray-800 px-4 py-2 text-white">
            ← Kembali
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

export default AnimeDetail;
