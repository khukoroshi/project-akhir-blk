import AnimeTableRow from "./AnimeTableRow";

function AnimeTable({ animeList, onEdit, onDelete }) {
  return (
    <div className="overflow-x-hidden overflow-y-auto rounded-xl max-h-[100vh] bg-white shadow-sm">
      {/* horizontal scroll untuk layar kecil */}

      <div className="overflow-auto">
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
export default AnimeTable;
