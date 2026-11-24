import { Link } from "react-router-dom";
import Badge from "./Badge";
import { Star } from "./icons";
import {
  formatLabel,
  statusLabel,
  seasonLabel,
  getAnimeTitle,
} from "../../utils/animeLabels";

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-canvas px-2 py-1 text-xs">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-1 text-right font-medium text-fg">
        {children}
      </span>
    </div>
  );
}

const AnimeListItem = ({ data }) => {
  const title = getAnimeTitle(data.title);
  const format = formatLabel(data.format);
  const episodes = data.episodes ? `${data.episodes} eps` : null;
  const formatLine = [format, episodes].filter(Boolean).join(" · ") || "-";

  const season = [seasonLabel(data.season), data.seasonYear]
    .filter(Boolean)
    .join(" ");
  const statusLine = [statusLabel(data.status), season]
    .filter(Boolean)
    .join(" · ");

  const score = data.averageScore ? (data.averageScore / 10).toFixed(1) : null;
  const genres = (data.genres ?? []).slice(0, 3);

  return (
    <div className="relative flex min-w-0 gap-3 rounded-md border border-border bg-subtle p-3 transition-colors hover:border-border-strong has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent">
      <div className="aspect-[2/3] w-24 shrink-0 self-start overflow-hidden rounded-md border border-border bg-canvas sm:w-28">
        {data.coverImage?.large && (
          <img
            src={data.coverImage.large}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-fg">
          {/* Stretched link: the whole card is clickable, accessible name = title only */}
          <Link
            to={`/anime/${data.id}`}
            className="outline-none after:absolute after:inset-0"
          >
            {title}
          </Link>
        </h3>

        <div className="mt-2 space-y-1.5">
          <Row label="Format">
            <span className="truncate">{formatLine}</span>
          </Row>
          <Row label="Status">
            <span className="truncate">{statusLine}</span>
          </Row>
          <Row label="Score">
            {score ? (
              <>
                <Star
                  className="size-3 shrink-0 fill-current text-attention"
                  aria-hidden="true"
                />
                {score}
              </>
            ) : (
              "-"
            )}
          </Row>
        </div>

        {genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {genres.map((genre) => (
              <Badge key={genre}>{genre}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeListItem;
