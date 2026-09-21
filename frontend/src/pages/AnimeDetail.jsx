import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

import formatDate from "../utils/formatDate";
import formatStatus from "../utils/formatStatus";
import formatValue from "../utils/formatValue";

import MainLayout from "../layouts/MainLayout";
import LoadingPage from "../components/common/LoadingPage";
import ErrorApiPage from "../components/common/ErrorApiPage";

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
        <LoadingPage text="Loading Anime...." />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout username={user?.name}>
        <div className="mx-auto max-w-5xl py-10">
          <ErrorApiPage error={error} />

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
      <div className="space-y-8 block text-center">
        <Link
          to="/"
          className="text-left inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <span className="text-lg">←</span>
          Back to Anime
        </Link>
        {/* Hero */}
        <section className="text-left relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
          {/* BANNER */}
          {anime.bannerImage && (
            <img
              src={anime.bannerImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
          )}

          {/* Gradient overlay */}

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/60" />

          {/* Bottom gradient */}

          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />

          {/* HERO CONTENT */}

          <div className="relative grid gap-8 p-6 sm:p-8 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] lg:p-10">
            {/* ============================= */}
            {/* COVER */}
            {/* ============================= */}

            <div className="mx-auto w-full max-w-[260px] md:mx-0">
              <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
                <img
                  src={anime.coverImage?.extraLarge || anime.coverImage?.large}
                  alt={title}
                  className="aspect-[2/3] w-full object-cover"
                />
              </div>
            </div>

            {/* ============================= */}
            {/* INFORMATION */}
            {/* ============================= */}

            <div className="flex flex-col justify-end">
              {/* Small label */}

              <div className="mb-4">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur">
                  Anime Details
                </span>
              </div>

              {/* Title */}

              <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {title}
              </h1>

              {/* Alternative title */}

              {alternativeTitle && (
                <p className="mt-2 text-sm text-slate-400 sm:text-base">
                  {alternativeTitle}
                </p>
              )}

              {/* Score */}

              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-lg">
                  ★
                </div>

                <div>
                  <p className="text-2xl font-bold">
                    {anime.averageScore
                      ? (anime.averageScore / 10).toFixed(1)
                      : "N/A"}
                    <span className="ml-1 text-sm font-normal text-slate-400">
                      / 10
                    </span>
                  </p>

                  <p className="text-xs text-slate-400">AniList Score</p>
                </div>
              </div>

              {/* Basic info */}

              <div className="mt-6 flex flex-wrap gap-2">
                {anime.format && (
                  <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">
                    {formatValue(anime.format)}
                  </span>
                )}

                {anime.episodes && (
                  <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">
                    {anime.episodes} Episodes
                  </span>
                )}

                {anime.duration && (
                  <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">
                    {anime.duration} min / ep
                  </span>
                )}

                {anime.status && (
                  <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">
                    {formatStatus(anime.status)}
                  </span>
                )}
              </div>

              {/* Genres */}

              {anime.genres?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {anime.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-200 ring-1 ring-indigo-400/20"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Add button */}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToList}
                  disabled={adding}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adding ? "Adding..." : "+ Add to My List"}
                </button>

                {addMessage && (
                  <p className="text-sm text-slate-300">{addMessage}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SYNOPSIS */}
        <section className="mx-auto rounded-2xl border max-w-[1000px] border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
              About
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Synopsis
            </h2>
          </div>

          <div
            className="max-w-4xl leading-7 text-slate-600"
            dangerouslySetInnerHTML={{
              __html:
                anime.description || "Tidak ada synopsis untuk anime ini.",
            }}
          />
        </section>

        {/* INFORMATION */}
        <section className="mx-auto text-left">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Details
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Information
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem label="Format" value={formatValue(anime.format)} />

            <InfoItem label="Episodes" value={anime.episodes} />

            <InfoItem
              label="Duration"
              value={anime.duration ? `${anime.duration} min` : null}
            />

            <InfoItem label="Status" value={formatStatus(anime.status)} />

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
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-800">{value || "Unknown"}</p>
    </div>
  );
}

export default AnimeDetail;
