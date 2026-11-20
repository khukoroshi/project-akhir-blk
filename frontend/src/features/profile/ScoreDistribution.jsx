const SCORES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

function ScoreDistribution({ distribution }) {
  const rows = SCORES.map((score) => ({
    score,
    count: distribution?.[score] ?? 0,
  }));

  const max = Math.max(...rows.map((row) => row.count));

  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
        Distribusi skor
      </h3>

      <ol className="mt-3 space-y-2">
        {rows.map(({ score, count }) => (
          <li key={score} className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-slate-600 dark:text-slate-400">
              Skor {score}
            </span>

            <div
              aria-hidden="true"
              className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <div
                className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400"
                style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }}
              />
            </div>

            <span className="w-10 shrink-0 text-right font-medium tabular-nums text-slate-900 dark:text-slate-200">
              {count}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Skor desimal dihitung ke bagian bulatnya (8,5 masuk skor 8).
      </p>
    </div>
  );
}

export default ScoreDistribution;
