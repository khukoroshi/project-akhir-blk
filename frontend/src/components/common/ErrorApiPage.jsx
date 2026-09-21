const ErrorApiPage = ({ error }) => {
  return (
    <div className="text-center mt-[50px] text-red-600">
      <h3>Gagal Memuat Data Anime</h3>

      <p>{error}</p>

      <p className="text-[#666] text-sm">
        Kemungkinan server API sedang down atau sibuk. Coba refresh dan tunggu
        beberapa saat lagi.
      </p>
    </div>
  );
};

export default ErrorApiPage;
