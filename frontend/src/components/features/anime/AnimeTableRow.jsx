function AnimeTableRow({ anime, index, onEdit, onDelete }) {
  return (
    <tr
      className="
        border-b
        border-slate-100
        transition
        hover:bg-slate-50
        last:border-b-0

        dark:border-slate-800
        dark:hover:bg-slate-800/50
      "
    >
      {/* NUMBER */}
      <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">
        {index + 1}
      </td>

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
        <p className="font-semibold text-slate-900 dark:text-white">
          {anime.anim_title}
        </p>

        {anime.anim_personal_notes && (
          <p className="mt-1 max-w-[280px] truncate text-xs text-slate-500 dark:text-slate-400">
            {anime.anim_personal_notes}
          </p>
        )}
      </td>

      {/* SCORE */}
      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
        {anime.anim_score ? `⭐ ${anime.anim_score}` : "-"}
      </td>

      {/* TYPE */}
      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
        {anime.anim_type || "-"}
      </td>

      {/* PROGRESS */}
      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
        {anime.anim_current_episode} / {anime.anim_total_episode || "?"}
      </td>

      {/* TIER */}
      <td className="px-4 py-3">
        {anime.anim_tier ? (
          <span
            className="
              rounded-full
              bg-slate-100
              px-2.5 py-1
              text-xs
              font-semibold
              text-slate-700

              dark:bg-slate-800
              dark:text-slate-300
            "
          >
            {anime.anim_tier}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-600">-</span>
        )}
      </td>

      {/* ACTION */}
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(anime)}
            className="
              rounded-md
              bg-slate-900
              px-3 py-1.5
              text-xs
              font-medium
              text-white
              transition
              hover:bg-slate-700

              dark:bg-white
              dark:text-slate-900
              dark:hover:bg-slate-200
            "
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(anime.anim_id)}
            className="
              rounded-md
              border border-red-300
              px-3 py-1.5
              text-xs
              font-medium
              text-red-600
              transition
              hover:bg-red-50

              dark:border-red-500/30
              dark:text-red-400
              dark:hover:bg-red-500/10
            "
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default AnimeTableRow;
