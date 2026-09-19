import { Link } from "react-router-dom";
const DaftarAnime = ({ animeList }) => {
  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Daftar Anime Populer</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        {animeList.map((anime) => (
          <Link
            to={`/anime/${anime.id}`}
            key={anime.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "10px",
              textAlign: "center",
            }}
          >
            <img
              src={anime.coverImage?.large}
              alt={anime.title?.english || anime.title?.romaji || "Anime"}
              style={{
                width: "100%",
                height: "300px",
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />

            <h3
              style={{
                fontSize: "16px",
                margin: "10px 0 5px",
              }}
            >
              {anime.title?.english ||
                anime.title?.romaji ||
                anime.title?.native}
            </h3>

            <p>Episode: {anime.episodes ?? "Unknown"}</p>

            <p>Type: {anime.format ?? "Unknown"}</p>

            <p>Status: {anime.status ?? "Unknown"}</p>

            <p
              style={{
                color: "#666",
                fontSize: "14px",
              }}
            >
              Skor: ⭐ {anime.averageScore ?? "N/A"}/100
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DaftarAnime;
