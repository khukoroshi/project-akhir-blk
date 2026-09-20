import { useEffect, useState } from "react";
import api from "../../../services/api";

function AnimeList() {
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingAnime, setEditingAnime] = useState(null);

  const fetchAnimeList = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/anime");

      setAnimeList(response.data.data || []);
    } catch (err) {
      console.error("Gagal mengambil anime list:", err);

      setError(err.response?.data?.message || "Gagal mengambil daftar anime.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    return (
      <div className="py-10 text-center text-gray-500">
        Loading anime list...
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error) {
    return (
      <div className="rounded-lg bg-red-100 p-4 text-red-700">{error}</div>
    );
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
        {/* ================================= */}
        {/* CURRENTLY WATCHING */}
        {/* ================================= */}

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

        {/* ================================= */}
        {/* COMPLETED */}
        {/* ================================= */}

        {completedAnime.length > 0 && (
          <AnimeSection title="Completed" count={completedAnime.length}>
            <AnimeTable
              animeList={completedAnime}
              onEdit={setEditingAnime}
              onDelete={handleDelete}
            />
          </AnimeSection>
        )}

        {/* ================================= */}
        {/* PLAN TO WATCH */}
        {/* ================================= */}

        {planToWatchAnime.length > 0 && (
          <AnimeSection title="Plan to Watch" count={planToWatchAnime.length}>
            <AnimeTable
              animeList={planToWatchAnime}
              onEdit={setEditingAnime}
              onDelete={handleDelete}
            />
          </AnimeSection>
        )}

        {/* ================================= */}
        {/* DROPPED */}
        {/* ================================= */}

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

      {/* ================================= */}
      {/* EDIT MODAL */}
      {/* ================================= */}

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

/*
|--------------------------------------------------------------------------
| SECTION
|--------------------------------------------------------------------------
*/

function AnimeSection({ title, count, children }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>

          <p className="mt-1 text-sm text-gray-500">{count} anime</p>
        </div>
      </div>

      {children}
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| WATCHING CARD
|--------------------------------------------------------------------------
*/

function AnimeCard({ anime, onIncrement, onEdit, onDelete }) {
  const progress =
    anime.anim_total_episode > 0
      ? Math.min(
          (anime.anim_current_episode / anime.anim_total_episode) * 100,
          100,
        )
      : 0;

  const isCompleted =
    anime.anim_total_episode > 0 &&
    anime.anim_current_episode >= anime.anim_total_episode;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {/* IMAGE */}

        <div className="h-64 w-full shrink-0 sm:h-52 sm:w-36">
          <img
            src={anime.anim_img_url}
            alt={anime.anim_title}
            className="h-full w-full object-cover"
          />
        </div>

        {/* CONTENT */}

        <div className="flex flex-1 flex-col p-5">
          {/* TITLE + SCORE */}

          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <div>
              <h2 className="text-xl font-bold">{anime.anim_title}</h2>

              <p className="mt-1 text-sm text-gray-500">{anime.anim_type}</p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs text-gray-500">My Score</p>

              <p className="font-semibold">
                {anime.anim_score ? `⭐ ${anime.anim_score}/10` : "Not rated"}
              </p>
            </div>
          </div>

          {/* EPISODE */}

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Episode</span>

              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {anime.anim_current_episode} /{" "}
                  {anime.anim_total_episode || "?"}
                </span>

                <button
                  type="button"
                  onClick={() => onIncrement(anime.anim_id)}
                  disabled={isCompleted}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-lg font-bold leading-none text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                  title={isCompleted ? "Anime sudah selesai" : "Tambah episode"}
                >
                  +
                </button>
              </div>
            </div>

            {/* PROGRESS BAR */}

            {anime.anim_total_episode > 0 && (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-black transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            )}
          </div>

          {/* TAGS */}

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

          {/* NOTES */}

          {anime.anim_personal_notes && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-500">My Notes</p>

              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                {anime.anim_personal_notes}
              </p>
            </div>
          )}

          {/* ACTION */}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => onDelete(anime.anim_id)}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| TABLE
|--------------------------------------------------------------------------
*/

function AnimeTable({ animeList, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      {/* horizontal scroll untuk layar kecil */}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          {/* HEADER */}

          <thead className="bg-gray-50">
            <tr className="border-b text-left">
              <th className="w-12 px-4 py-3 text-center">#</th>

              <th className="w-20 px-4 py-3">Image</th>

              <th className="px-4 py-3">Anime Title</th>

              <th className="w-24 px-4 py-3">Score</th>

              <th className="w-24 px-4 py-3">Type</th>

              <th className="w-28 px-4 py-3">Progress</th>

              <th className="w-28 px-4 py-3">Tier</th>

              <th className="w-32 px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          {/* BODY */}

          <tbody>
            {animeList.map((anime, index) => (
              <AnimeTableRow
                key={anime.anim_id}
                anime={anime}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| TABLE ROW
|--------------------------------------------------------------------------
*/

function AnimeTableRow({ anime, index, onEdit, onDelete }) {
  return (
    <tr className="border-b last:border-b-0 hover:bg-gray-50">
      {/* NUMBER */}

      <td className="px-4 py-3 text-center text-gray-500">{index + 1}</td>

      {/* IMAGE */}

      <td className="px-4 py-3">
        <img
          src={anime.anim_img_url}
          alt={anime.anim_title}
          className="h-16 w-12 rounded object-cover"
        />
      </td>

      {/* TITLE */}

      <td className="max-w-[300px] px-4 py-3">
        <p className="font-semibold text-gray-900">{anime.anim_title}</p>

        {anime.anim_personal_notes && (
          <p className="mt-1 max-w-[280px] truncate text-xs text-gray-500">
            {anime.anim_personal_notes}
          </p>
        )}
      </td>

      {/* SCORE */}

      <td className="px-4 py-3">
        {anime.anim_score ? `⭐ ${anime.anim_score}` : "-"}
      </td>

      {/* TYPE */}

      <td className="px-4 py-3">{anime.anim_type || "-"}</td>

      {/* PROGRESS */}

      <td className="px-4 py-3">
        {anime.anim_current_episode} / {anime.anim_total_episode || "?"}
      </td>

      {/* TIER */}

      <td className="px-4 py-3">
        {anime.anim_tier ? (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold">
            {anime.anim_tier}
          </span>
        ) : (
          "-"
        )}
      </td>

      {/* ACTION */}

      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(anime)}
            className="rounded-md bg-black px-3 py-1.5 text-xs text-white hover:bg-gray-800"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(anime.anim_id)}
            className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

/*
|--------------------------------------------------------------------------
| EDIT MODAL
|--------------------------------------------------------------------------
*/

function EditAnimeModal({ anime, onClose, onSave }) {
  const [form, setForm] = useState({
    eps: anime.anim_current_episode ?? 0,
    status: anime.anim_status ?? "watching",
    tier: anime.anim_tier ?? "",
    score: anime.anim_score ?? "",
    notes: anime.anim_personal_notes ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      await onSave(anime.anim_id, {
        eps: Number(form.eps),
        teps: anime.anim_total_episode,
        status: form.status,
        tier: form.tier || null,
        score: form.score === "" ? null : Number(form.score),
        notes: form.notes || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        {/* HEADER */}

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Edit Anime</h2>

          <button
            type="button"
            onClick={onClose}
            className="text-xl text-gray-500 hover:text-black"
          >
            ×
          </button>
        </div>

        <p className="mt-1 text-sm text-gray-500">{anime.anim_title}</p>

        {/* ERROR */}

        {error && (
          <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* EPISODE */}

          <div>
            <label htmlFor="eps" className="mb-1 block text-sm font-medium">
              Current Episode
            </label>

            <input
              id="eps"
              name="eps"
              type="number"
              min="0"
              max={anime.anim_total_episode || undefined}
              value={form.eps}
              onChange={handleChange}
              className="w-full rounded-lg border px-3 py-2"
            />

            <p className="mt-1 text-xs text-gray-500">
              Total: {anime.anim_total_episode || "Unknown"}
            </p>
          </div>

          {/* STATUS */}

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium">
              Status
            </label>

            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="watching">Watching</option>

              <option value="completed">Completed</option>

              <option value="dropped">Dropped</option>

              <option value="plan to watch">Plan to Watch</option>
            </select>
          </div>

          {/* TIER */}

          <div>
            <label htmlFor="tier" className="mb-1 block text-sm font-medium">
              Tier
            </label>

            <select
              id="tier"
              name="tier"
              value={form.tier}
              onChange={handleChange}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="">No Tier</option>

              <option value="S">S</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          {/* SCORE */}

          <div>
            <label htmlFor="score" className="mb-1 block text-sm font-medium">
              My Score
            </label>

            <input
              id="score"
              name="score"
              type="number"
              min="1"
              max="10"
              value={form.score}
              onChange={handleChange}
              placeholder="1 - 10"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          {/* NOTES */}

          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium">
              Notes
            </label>

            <textarea
              id="notes"
              name="notes"
              rows="4"
              value={form.notes}
              onChange={handleChange}
              placeholder="Tulis catatan tentang anime ini..."
              className="w-full resize-none rounded-lg border px-3 py-2"
            />
          </div>

          {/* BUTTON */}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AnimeList;
