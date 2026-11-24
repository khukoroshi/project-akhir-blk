import CardImage from "./CardImage";
import AnimeListItem from "./AnimeListItem";
import { getLayoutClasses } from "../../utils/catalogLayout";

const DaftarAnime = ({ animeList, view = "grid" }) => {
  const Item = view === "list" ? AnimeListItem : CardImage;

  return (
    <div className={getLayoutClasses(view)}>
      {animeList.map((anime) => (
        <Item key={anime.id} data={anime} />
      ))}
    </div>
  );
};

export default DaftarAnime;
