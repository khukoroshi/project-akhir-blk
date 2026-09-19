import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import Button from "../components/common/Button";

const LoadingPage = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      Loading anime...
    </div>
  );
};
const ErrorApiPage = (error) => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px", color: "red" }}>
      <h3>Gagal Memuat Data Anime</h3>
      <p>{error}</p>
      <p style={{ fontSize: "14px", color: "#666" }}>
        Kemungkinan server Jikan API sedang down atau sibuk. Coba refresh
        beberapa saat lagi.
      </p>
    </div>
  );
};

function Home() {
  const [animeList, setAnimeList] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const link = "http://localhost:3000/api/catalog/anime";
  useEffect(() => {
    const fetchAnime = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = query.trim()
          ? `${link}?q=${encodeURIComponent(query)}`
          : link;

        console.log("Request URL:", url);

        const res = await fetch(url);

        console.log("Response status:", res.status);

        if (!res.ok) {
          throw new Error(`Server bermasalah (Status: ${res.status})`);
        }

        const json = await res.json();

        console.log("Data:", json);

        setAnimeList(json.data || []);
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchAnime, 800);

    return () => clearTimeout(timer);
  }, [query]);

  if (loading) {
    return <LoadingPage />;
  }
  if (error) {
    return <ErrorApiPage error={error} />;
  }
  // Tampilkan pesan error jika API gagal dihubungi

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-4 text-3xl font-bold">Welcome</h1>

        <p className="mb-4 text-gray-600">This is your React starter kit.</p>

        <Button>Get Started</Button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari Anime..."
          className="p-2 border rounded"
        />
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
          <h1>Daftar Anime Populer</h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "20px",
            }}
          >
            {animeList.map((anime) => (
              <div
                key={anime.mal_id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "10px",
                  textAlign: "center",
                }}
              >
                <img
                  src={anime.images.jpg.image_url}
                  alt={anime.title}
                  style={{
                    width: "100%",
                    height: "300px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
                <h3 style={{ fontSize: "16px", margin: "10px 0 5px" }}>
                  {anime.title}
                </h3>
                <p style={{ color: "#666", fontSize: "14px" }}>
                  Skor: ⭐ {anime.score || "N/A"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Home;
