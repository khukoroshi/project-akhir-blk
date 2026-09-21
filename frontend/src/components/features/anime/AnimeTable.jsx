import AnimeTableRow from "./AnimeTableRow";

function AnimeTable({ animeList, onEdit, onDelete }) {
  return (
    <div
      className="
        max-h-[100vh]
        overflow-hidden
        rounded-xl
        border border-slate-200
        bg-white
        shadow-sm

        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      {/* Horizontal scroll untuk layar kecil */}
      <div className="overflow-auto">
        <table className="w-full min-w-[800px] text-sm">
          {/* HEADER */}
          <thead className="bg-slate-50 dark:bg-slate-800/70">
            <tr className="border-b border-slate-200 text-left dark:border-slate-800">
              <th className="w-12 px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                #
              </th>

              <th className="w-20 px-4 py-3 text-slate-600 dark:text-slate-300">
                Image
              </th>

              <th className="px-4 py-3 text-slate-600 dark:text-slate-300">
                Anime Title
              </th>

              <th className="w-24 px-4 py-3 text-slate-600 dark:text-slate-300">
                Score
              </th>

              <th className="w-24 px-4 py-3 text-slate-600 dark:text-slate-300">
                Type
              </th>

              <th className="w-28 px-4 py-3 text-slate-600 dark:text-slate-300">
                Progress
              </th>

              <th className="w-28 px-4 py-3 text-slate-600 dark:text-slate-300">
                Tier
              </th>

              <th className="w-32 px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                Action
              </th>
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

export default AnimeTable;
