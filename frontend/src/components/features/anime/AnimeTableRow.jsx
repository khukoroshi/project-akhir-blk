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

export default AnimeTableRow;
