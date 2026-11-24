import CardImage from "./CardImage";

const DaftarAnime = ({ animeList }) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
      {animeList.map((anime) => (
        <CardImage key={anime.id} data={anime} />
      ))}
    </div>
  );
};

export default DaftarAnime;
