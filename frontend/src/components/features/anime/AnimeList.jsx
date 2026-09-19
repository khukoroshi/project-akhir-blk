import { useEffect, useState } from "react";

import api from "../../../services/api";

function AnimeList() {
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnimeList = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/anime");

        setAnimeList(response.data.data || []);
      } catch (err) {
        console.error("Gagal mengambil anime list:", err);

        setError(
          err.response?.data?.message || "Gagal mengambil daftar anime.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeList();
  }, []);

  if (loading) {
    return (
      <div className="py-10 text-center text-gray-500">
        Loading anime list...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-100 p-4 text-red-700">{error}</div>
    );
  }

  if (animeList.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-semibold">My List masih kosong</h2>

        <p className="mt-2 text-gray-500">
          Tambahkan anime yang ingin kamu tonton.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {animeList.map((anime) => (
        <AnimeCard key={anime.anim_id} anime={anime} />
      ))}
    </div>
  );
}

function AnimeCard({ anime }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="h-64 w-full shrink-0 sm:h-44 sm:w-32">
          <img
            src={anime.anim_img_url}
            alt={anime.anim_title}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <div>
              <h2 className="text-xl font-bold">{anime.anim_title}</h2>

              <p className="mt-1 text-sm text-gray-500">{anime.anim_type}</p>
            </div>

            {/* Score */}
            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-500">My Score</p>

              <p className="font-semibold">
                {anime.anim_score ? `⭐ ${anime.anim_score}/10` : "Not rated"}
              </p>
            </div>
          </div>

          {/* Episode */}
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>Episode</span>

              <span>
                {anime.anim_current_episode} / {anime.anim_total_episode || "?"}
              </span>
            </div>

            {anime.anim_total_episode > 0 && (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-black"
                  style={{
                    width: `${Math.min(
                      (anime.anim_current_episode / anime.anim_total_episode) *
                        100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {anime.anim_status && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                {anime.anim_status}
              </span>
            )}

            {anime.anim_tier && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                Tier {anime.anim_tier}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
            >
              Edit
            </button>

            <button
              type="button"
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnimeList;
