import Card from "../../components/common/Card";
import formatDate from "../../utils/formatDate";
import { formatLabel, statusLabel } from "../../utils/animeLabels";

function AnimeInfoGrid({ anime }) {
  const items = [
    ["Format", formatLabel(anime.format)],
    ["Episodes", anime.episodes || null],
    ["Duration", anime.duration ? `${anime.duration} min` : null],
    ["Status", statusLabel(anime.status)],
    ["Start Date", formatDate(anime.startDate)],
    ["End Date", formatDate(anime.endDate)],
    ["AniList Score", anime.averageScore ? `${anime.averageScore}/100` : null],
  ];

  return (
    <Card
      as="section"
      aria-labelledby="information-heading"
      className="p-4 sm:p-6"
    >
      <h2 id="information-heading" className="mb-3 text-xl font-semibold">
        Information
      </h2>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-md border border-border bg-canvas p-3"
          >
            <dt className="text-xs font-medium uppercase tracking-wider text-muted">
              {label}
            </dt>
            <dd className="mt-1 wrap-break-word font-semibold text-fg">
              {value ?? "-"}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default AnimeInfoGrid;
