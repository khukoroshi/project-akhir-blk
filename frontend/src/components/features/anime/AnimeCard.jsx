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

export default AnimeCard;
