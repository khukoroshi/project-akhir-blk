const ErrorApiPage = ({ error }) => {
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

export default ErrorApiPage;
