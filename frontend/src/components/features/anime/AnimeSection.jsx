function AnimeSection({ title, count, children }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {title}
          </h2>

          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {count} anime
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

export default AnimeSection;
