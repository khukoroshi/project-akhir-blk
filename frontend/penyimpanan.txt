import MainLayout from "../layouts/MainLayout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AnimeList = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate(); // 2. Inisialisasi router
  console.log("masuk list");
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/auth/profile");
        setProfile(response.data.data.userInfo);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || "Gagal memuat profil");
      } finally {
        setLoading(false); // untuk status loading berhenti
      }
    };

    fetchProfile();
  }, []);

  // Fungsi tombol Keluar (Logout)
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) return <p style={{ padding: "20px" }}>Memuat data rahasia...</p>;
  if (errorMsg)
    return <div style={{ padding: "20px", color: "red" }}>⚠️ {errorMsg}</div>;

  return (
    <MainLayout username={profile.name}>
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h2>Dashboard / Profil Saya</h2>
        <div
          style={{
            background: "#f4f4f4",
            padding: "15px",
            borderRadius: "5px",
            maxWidth: "400px",
          }}
        >
          <p>
            <strong>ID Pengguna:</strong> {profile?.id}
            {/* <strong>ID Pengguna:</strong> 1 */}
          </p>
          <p>
            {/* <strong>Email:</strong> testing@gmailcom */}
            <strong>Email:</strong> {profile?.email}
          </p>
          <p>
            {/* <strong>Email:</strong> testing@gmailcom */}
            <strong>Nama:</strong> {profile?.name}
          </p>
        </div>
        <br />
        <button
          onClick={handleLogout}
          style={{
            background: "#ff4d4d",
            color: "white",
            border: "none",
            padding: "8px 15px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Keluar (Logout)
        </button>
      </div>
    </MainLayout>
  );
};

export default AnimeList;
