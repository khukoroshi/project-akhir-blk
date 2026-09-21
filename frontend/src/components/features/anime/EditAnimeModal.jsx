import { useState } from "react";

import Modal from "../../common/Modal";
import Input from "../../common/Input";

function EditAnimeModal({ anime, onClose, onSave }) {
  const [form, setForm] = useState({
    eps: anime.anim_current_episode ?? 0,
    teps: anime.anim_total_episode,
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
    <Modal isOpen={true} onClose={onClose} title="Edit Anime">
      {/* TITLE */}
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {anime.anim_title}
      </p>

      {/* ERROR */}
      {error && (
        <div
          className="
            mt-4
            rounded-lg
            border
            border-red-200
            bg-red-50
            p-3
            text-sm
            text-red-700

            dark:border-red-500/20
            dark:bg-red-500/10
            dark:text-red-400
          "
        >
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
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Total: {anime.anim_total_episode || "Unknown"}
          </p>
        </Input>

        {/* STATUS */}
        <div>
          <label
            htmlFor="status"
            className="
              mb-1
              block
              text-sm
              font-medium
              text-slate-700

              dark:text-slate-300
            "
          >
            Status
          </label>

          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
            className="
              w-full
              rounded-lg
              border
              border-slate-300
              bg-white
              px-3 py-2
              text-slate-900
              outline-none
              transition

              focus:border-indigo-500
              focus:ring-2
              focus:ring-indigo-500/20

              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
            "
          >
            <option value="watching">Watching</option>

            <option value="completed">Completed</option>

            <option value="dropped">Dropped</option>

            <option value="plan to watch">Plan to Watch</option>
          </select>
        </div>

        {/* TIER */}
        <div>
          <label
            htmlFor="tier"
            className="
              mb-1
              block
              text-sm
              font-medium
              text-slate-700

              dark:text-slate-300
            "
          >
            Tier
          </label>

          <select
            id="tier"
            name="tier"
            value={form.tier}
            onChange={handleChange}
            className="
              w-full
              rounded-lg
              border
              border-slate-300
              bg-white
              px-3 py-2
              text-slate-900
              outline-none
              transition

              focus:border-indigo-500
              focus:ring-2
              focus:ring-indigo-500/20

              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
            "
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

        {/* NOTES */}
        <div>
          <label
            htmlFor="notes"
            className="
              mb-1
              block
              text-sm
              font-medium
              text-slate-700

              dark:text-slate-300
            "
          >
            Notes
          </label>

          <textarea
            id="notes"
            name="notes"
            rows="4"
            value={form.notes}
            onChange={handleChange}
            placeholder="Tulis catatan tentang anime ini..."
            className="
              w-full
              resize-none
              rounded-lg
              border
              border-slate-300
              bg-white
              px-3 py-2
              text-slate-900
              outline-none
              transition

              placeholder:text-slate-400

              focus:border-indigo-500
              focus:ring-2
              focus:ring-indigo-500/20

              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
              dark:placeholder:text-slate-600
            "
          />
        </div>

        {/* BUTTON */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              rounded-lg
              border
              border-slate-300
              bg-white
              px-4 py-2
              text-sm
              font-medium
              text-slate-700
              transition
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-50

              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-300
              dark:hover:bg-slate-800
            "
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="
              rounded-lg
              bg-slate-900
              px-4 py-2
              text-sm
              font-medium
              text-white
              transition
              hover:bg-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-50

              dark:bg-white
              dark:text-slate-900
              dark:hover:bg-slate-200
            "
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EditAnimeModal;
