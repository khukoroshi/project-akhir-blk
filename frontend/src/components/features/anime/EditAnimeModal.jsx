import { useState } from "react";
import Modal from "../../common/Modal";
import Input from "../../common/Input";

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
    <Modal isOpen={onClose} onClose={onClose} title="Edit Anime">
      <p className="mt-1 text-sm text-gray-500">{anime.anim_title}</p>

      {/* ERROR */}

      {error && (
        <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* EPISODE */}

        <Input
          label="Current Episode"
          type="number"
          name="eps"
          min={0}
          max={anime.anim_total_episode || undefined}
          value={form.eps}
          onChange={handleChange}
          className="w-full"
        >
          <p className="mt-1 text-xs text-gray-500">
            Total: {anime.anim_total_episode || "Unknown"}
          </p>
        </Input>

        {/* <div>
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
        </div> */}

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

        <Input
          label="My Score"
          type="number"
          name="score"
          min={1}
          max={10}
          value={form.score}
          placeholder="1 - 10"
          onChange={handleChange}
          className="w-full"
        />
        {/* <div>
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
        </div> */}

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
    </Modal>
  );
}

export default EditAnimeModal;
