import Card from "../../components/common/Card";
import formatDate from "../../utils/formatDate";
import {
  formatLabel,
  seasonLabel,
  sourceLabel,
  statusLabel,
} from "../../utils/animeLabels";
import AnimeExternalLinks from "./AnimeExternalLinks";

const NUMBER = new Intl.NumberFormat("en-US");

function formatNumber(value) {
  return typeof value === "number" ? NUMBER.format(value) : null;
}

function getSeason(anime) {
  const label = seasonLabel(anime.season);
  if (!label) return null;
  return anime.seasonYear ? `${label} ${anime.seasonYear}` : label;
}

// Prefer animation studios; fall back to every studio AniList lists.
function getStudios(studios) {
  const list = (
    studios?.nodes ??
    studios?.edges?.map((edge) => edge.node) ??
    []
  ).filter((studio) => studio?.name);
  const animation = list.filter((studio) => studio.isAnimationStudio);
  const chosen = animation.length > 0 ? animation : list;
  return chosen.map((studio) => studio.name).join(", ") || null;
}

function AnimeInfoSidebar({ anime }) {
  const items = [
    ["Format", formatLabel(anime.format)],
    ["Episodes", anime.episodes || null],
    ["Duration", anime.duration ? `${anime.duration} min` : null],
    ["Status", anime.status ? statusLabel(anime.status) : null],
    ["Start Date", formatDate(anime.startDate)],
    ["End Date", formatDate(anime.endDate)],
    ["Season", getSeason(anime)],
    ["Source", sourceLabel(anime.source)],
    ["Studios", getStudios(anime.studios)],
    ["AniList Score", anime.averageScore ? `${anime.averageScore}/100` : null],
    ["Popularity", formatNumber(anime.popularity)],
    ["Favorites", formatNumber(anime.favourites)],
  ];

  return (
    <div className="space-y-6">
      <Card as="section" aria-labelledby="information-heading" className="p-4">
        <h2 id="information-heading" className="mb-3 text-xl font-semibold">
          Information
        </h2>
        <dl className="space-y-3">
          {items.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                {label}
              </dt>
              <dd className="mt-0.5 wrap-break-word font-semibold text-fg">
                {value ?? "-"}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <AnimeExternalLinks links={anime.externalLinks} />
    </div>
  );
}

export default AnimeInfoSidebar;
