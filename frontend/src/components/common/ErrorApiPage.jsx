const ErrorApiPage = ({ error }) => {
  return (
    <div className="text-center mt-[50px] text-red-600">
      <h3>Failed to Load Anime Data</h3>
      <p>{error}</p>
      <p className="text-[#666] text-sm">
        The anime API server may be down or busy. Please refresh the page and
        try again in a moment.
      </p>
    </div>
  );
};

export default ErrorApiPage;
