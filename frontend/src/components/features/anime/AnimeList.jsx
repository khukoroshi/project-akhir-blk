import { useEffect, useState } from "react";
import api from "../../../services/api";

import AnimeSection from "./AnimeSection";
import AnimeCard from "./AnimeCard";
import AnimeTable from "./AnimeTable";
import EditAnimeModal from "./EditAnimeModal";

import LoadingPage from "../../common/LoadingPage";
import ErrorApiPage from "../../common/ErrorApiPage";

function AnimeList() {
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingAnime, setEditingAnime] = useState(null);

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

  // =========================
  // INCREMENT EPISODE
  // =========================
  const handleIncrement = async (animId) => {
    try {
      const response = await api.patch(`/anime/${animId}/increment`);

      const updatedAnime = response.data.data;

      setAnimeList((prev) =>
        prev.map((anime) =>
          anime.anim_id === updatedAnime.anim_id ? updatedAnime : anime,
        ),
      );
    } catch (err) {
      console.error("Gagal menambah episode:", err);

      alert(err.response?.data?.message || "Gagal menambah episode.");
    }
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (animId) => {
    const confirmed = window.confirm(
      "Yakin ingin menghapus anime ini dari My List?",
    );

    if (!confirmed) return;

    try {
      await api.delete(`/anime/${animId}`);

      setAnimeList((prev) => prev.filter((anime) => anime.anim_id !== animId));
    } catch (err) {
      console.error("Gagal menghapus anime:", err);

      alert(err.response?.data?.message || "Gagal menghapus anime.");
    }
  };

  // =========================
  // UPDATE
  // =========================
  const handleUpdate = async (animId, formData) => {
    try {
      const response = await api.put(`/anime/${animId}`, formData);

      const updatedAnime = response.data.data;

      setAnimeList((prev) =>
        prev.map((anime) =>
          anime.anim_id === updatedAnime.anim_id ? updatedAnime : anime,
        ),
      );

      setEditingAnime(null);
    } catch (err) {
      console.error("Gagal memperbarui anime:", err);

      throw new Error(
        err.response?.data?.message || "Gagal memperbarui anime.",
      );
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return <LoadingPage />;
  }

  // =========================
  // ERROR
  // =========================
  if (error) {
    return <ErrorApiPage error={error} />;
  }

  // =========================
  // FILTER BERDASARKAN STATUS
  // =========================
  const watchingAnime = animeList.filter(
    (anime) => anime.anim_status === "watching",
  );

  const completedAnime = animeList.filter(
    (anime) => anime.anim_status === "completed",
  );

  const planToWatchAnime = animeList.filter(
    (anime) => anime.anim_status === "plan to watch",
  );

  const droppedAnime = animeList.filter(
    (anime) => anime.anim_status === "dropped",
  );

  // =========================
  // EMPTY
  // =========================
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
    <>
      <div className="space-y-10">
        {/* CURRENTLY WATCHING */}

        {watchingAnime.length > 0 && (
          <AnimeSection title="Currently Watching" count={watchingAnime.length}>
            <div className="space-y-4">
              {watchingAnime.map((anime) => (
                <AnimeCard
                  key={anime.anim_id}
                  anime={anime}
                  onIncrement={handleIncrement}
                  onEdit={() => setEditingAnime(anime)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </AnimeSection>
        )}

        {/* COMPLETED */}

        {completedAnime.length > 0 && (
          <AnimeSection title="Completed" count={completedAnime.length}>
            <AnimeTable
              animeList={completedAnime}
              onEdit={setEditingAnime}
              onDelete={handleDelete}
            />
          </AnimeSection>
        )}

        {/* PLAN TO WATCH */}

        {planToWatchAnime.length > 0 && (
          <AnimeSection title="Plan to Watch" count={planToWatchAnime.length}>
            <AnimeTable
              animeList={planToWatchAnime}
              onEdit={setEditingAnime}
              onDelete={handleDelete}
            />
          </AnimeSection>
        )}

        {/* DROPPED */}

        {droppedAnime.length > 0 && (
          <AnimeSection title="Dropped" count={droppedAnime.length}>
            <AnimeTable
              animeList={droppedAnime}
              onEdit={setEditingAnime}
              onDelete={handleDelete}
            />
          </AnimeSection>
        )}
      </div>

      {/* EDIT MODAL */}

      {editingAnime && (
        <EditAnimeModal
          anime={editingAnime}
          onClose={() => setEditingAnime(null)}
          onSave={handleUpdate}
        />
      )}
    </>
  );
}
export default AnimeList;
