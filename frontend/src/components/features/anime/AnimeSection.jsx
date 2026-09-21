function AnimeSection({ title, count, children }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>

          <p className="mt-1 text-sm text-gray-500">{count} anime</p>
        </div>
      </div>

      {children}
    </section>
  );
}

export default AnimeSection;
