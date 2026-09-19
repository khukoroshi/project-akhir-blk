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

  const [error, setError] = useState("");

  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState("");

  useEffect(() => {
    const fetchAnimeDetail = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/catalog/anime/${id}`);

        setAnime(response.data.data);
      } catch (err) {
        console.error("Gagal mengambil detail anime:", err);

        setError(
          err.response?.data?.message || "Gagal mengambil detail anime.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeDetail();
  }, [id]);

  const handleAddToList = async () => {
    setAdding(true);
    setAddMessage("");

    try {
      const title =
        anime.title?.english ||
        anime.title?.romaji ||
        anime.title?.native ||
        "Unknown";

      const response = await api.post("/anime", {
        externalId: anime.id,
        externalSource: "anilist",

        title,

        imgUrl: anime.coverImage?.extraLarge || anime.coverImage?.large || null,

        totalEps: anime.episodes || 0,

        type: anime.format || "TV",

        status: "watching",

        tier: null,

        score: null,

        notes: null,
      });

      console.log("Anime berhasil ditambahkan:", response.data);

      setAddMessage("Anime berhasil ditambahkan ke My List!");
    } catch (err) {
      console.error("Gagal menambahkan anime:", err);

      setAddMessage(err.response?.data?.message || "Gagal menambahkan anime.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <MainLayout username={user?.name}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-gray-500">Loading anime...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout username={user?.name}>
        <div className="mx-auto max-w-5xl py-10">
          <div className="rounded-lg bg-red-100 p-4 text-red-700">{error}</div>

          <Link to="/" className="mt-4 inline-block">
            ← Kembali ke Home
          </Link>
        </div>
      </MainLayout>
    );
  }

  if (!anime) {
    return (
      <MainLayout username={user?.name}>
        <div className="py-10 text-center">Anime tidak ditemukan.</div>
      </MainLayout>
    );
  }

  const title =
    anime.title?.english ||
    anime.title?.romaji ||
    anime.title?.native ||
    "Unknown";

  const alternativeTitle =
    anime.title?.romaji !== title ? anime.title?.romaji : anime.title?.native;

  return (
    <MainLayout username={user?.name}>
      <div className="mx-auto max-w-6xl">
        {/* Back */}
        <Link
          to="/"
          className="mb-4 inline-block text-sm text-gray-600 hover:text-black"
        >
          ← Kembali
        </Link>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-xl bg-gray-900 text-white">
          {/* Banner */}
          {anime.bannerImage && (
            <img
              src={anime.bannerImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Content */}
          <div className="relative grid gap-6 p-6 md:grid-cols-[220px_1fr] md:p-8">
            {/* Cover */}
            <div>
              <img
                src={anime.coverImage?.extraLarge || anime.coverImage?.large}
                alt={title}
                className="w-full rounded-lg shadow-xl"
              />
            </div>

            {/* Info */}
            <div className="flex flex-col justify-end">
              <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>

              {alternativeTitle && (
                <p className="mt-1 text-sm text-gray-300">{alternativeTitle}</p>
              )}

              {/* Score */}
              <div className="mt-5 flex items-center gap-2">
                <span className="text-xl">⭐</span>

                <span className="text-xl font-semibold">
                  {anime.averageScore ?? "N/A"}
                </span>

                <span className="text-sm text-gray-400">/ 100</span>
              </div>

              {/* Basic info */}
              <div className="mt-4 flex flex-wrap gap-2">
                {anime.format && (
                  <span className="rounded bg-white/10 px-3 py-1 text-sm">
                    {anime.format}
                  </span>
                )}

                {anime.episodes && (
                  <span className="rounded bg-white/10 px-3 py-1 text-sm">
                    {anime.episodes} Episodes
                  </span>
                )}

                {anime.duration && (
                  <span className="rounded bg-white/10 px-3 py-1 text-sm">
                    {anime.duration} min/ep
                  </span>
                )}

                {anime.status && (
                  <span className="rounded bg-white/10 px-3 py-1 text-sm">
                    {anime.status}
                  </span>
                )}
              </div>

              {/* Genres */}
              {anime.genres?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {anime.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full bg-white/20 px-3 py-1 text-xs"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Add button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleAddToList}
                  disabled={adding}
                  className="rounded-lg bg-white px-5 py-2.5 font-medium text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adding ? "Adding..." : "+ Add to My List"}
                </button>
                {addMessage && (
                  <p className="mt-3 text-sm text-white">{addMessage}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Synopsis */}
        <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Synopsis</h2>

          <div
            className="mt-4 leading-7 text-gray-600"
            dangerouslySetInnerHTML={{
              __html:
                anime.description || "Tidak ada synopsis untuk anime ini.",
            }}
          />
        </section>

        {/* Information */}
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Information</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem label="Format" value={anime.format} />

            <InfoItem label="Episodes" value={anime.episodes} />

            <InfoItem
              label="Duration"
              value={anime.duration ? `${anime.duration} min` : null}
            />

            <InfoItem label="Status" value={anime.status} />

            <InfoItem label="Start Date" value={formatDate(anime.startDate)} />

            <InfoItem label="End Date" value={formatDate(anime.endDate)} />

            <InfoItem
              label="AniList Score"
              value={anime.averageScore ? `${anime.averageScore}/100` : null}
            />
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-1 font-medium">{value || "Unknown"}</p>
    </div>
  );
}

function formatDate(date) {
  if (!date?.year) {
    return null;
  }

  const month = date.month ? String(date.month).padStart(2, "0") : "01";

  const day = date.day ? String(date.day).padStart(2, "0") : "01";

  return `${date.year}-${month}-${day}`;
}

export default AnimeDetail;
