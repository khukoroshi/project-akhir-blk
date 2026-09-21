import CardImage from "./CardImage";

const DaftarAnime = ({ animeList }) => {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {animeList.map((anime) => (
          <CardImage key={anime.id} data={anime} />
        ))}
      </div>
    </div>
  );
};

export default DaftarAnime;
