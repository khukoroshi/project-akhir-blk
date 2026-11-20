import ScoreDistribution from "./ScoreDistribution";

function ProfileStats({ stats }) {
  const items = [
    { label: "Total", value: stats.total },
    { label: "Watching", value: stats.byStatus?.watching ?? 0 },
    { label: "Completed", value: stats.byStatus?.completed ?? 0 },
    { label: "Dropped", value: stats.byStatus?.dropped ?? 0 },
    { label: "Plan to watch", value: stats.byStatus?.["plan to watch"] ?? 0 },
    { label: "Episodes watched", value: stats.episodesWatched },
    {
      label: "Mean score",
      value: stats.meanScore === null ? "-" : stats.meanScore.toFixed(1),
    },
  ];

  return (
    <section
      aria-labelledby="profile-stats-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2
        id="profile-stats-heading"
        className="text-lg font-semibold text-slate-900 dark:text-white"
      >
        Statistik
      </h2>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60"
          >
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {item.label}
            </dt>
            <dd className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <ScoreDistribution distribution={stats.scoreDistribution} />
    </section>
  );
}

export default ProfileStats;
