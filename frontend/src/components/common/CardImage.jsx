import { Link } from "react-router-dom";
import Badge from "./Badge";
import { Star } from "./icons";
import { formatLabel, statusLabel } from "../../utils/animeLabels";

const CardImage = ({ data }) => {
  const title =
    data.title?.english ||
    data.title?.romaji ||
    data.title?.native ||
    "Unknown Anime";

  const score = data.averageScore ? (data.averageScore / 10).toFixed(1) : null;
  const format = formatLabel(data.format);

  return (
    <Link
      to={`/anime/${data.id}`}
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-subtle transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="relative aspect-[2/3] overflow-hidden border-b border-border bg-subtle">
        {data.coverImage?.large && (
          <img
            src={data.coverImage.large}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}

        <Badge className="absolute left-2 top-2">
          {score ? (
            <>
              <Star
                className="size-3 fill-current text-attention"
                aria-hidden="true"
              />
              <span className="sr-only">Skor </span>
              {score}
            </>
          ) : (
            "N/A"
          )}
        </Badge>

        {format && <Badge className="absolute right-2 top-2">{format}</Badge>}
      </div>

      <div className="p-3">
        <h3
          className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-fg"
          title={title}
        >
          {title}
        </h3>

        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
          <span className="shrink-0">
            {data.episodes ? `${data.episodes} eps` : "-"}
          </span>
          <span className="truncate">{statusLabel(data.status)}</span>
        </div>
      </div>
    </Link>
  );
};

export default CardImage;
