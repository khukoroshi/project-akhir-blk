import { useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../components/common/Button";
import { Check, Star } from "../../components/common/icons";
import useAddToList from "../watchlist/useAddToList";
import {
  formatLabel,
  getAnimeTitle,
  statusLabel,
} from "../../utils/animeLabels";

// White-on-dark chips: intentional exception to tokens (text sits on an image).
const CHIP =
  "inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white";

function FeaturedSlide({ item, index, total, active }) {
  const { addToList, pendingStatus } = useAddToList();
  const [added, setAdded] = useState(null); // status that was added
  const [message, setMessage] = useState("");

  const title = getAnimeTitle(item.title);
  const image =
    item.bannerImage || item.coverImage?.extraLarge || item.coverImage?.large;
  const eager = index === 0;

  const meta = [
    formatLabel(item.format),
    item.episodes ? `${item.episodes} eps` : null,
    statusLabel(item.status),
  ]
    .filter(Boolean)
    .join(" · ");

  const handleAdd = async (status) => {
    setMessage("");
    const result = await addToList(item.id, status, title);
    if (!result) return;
    setMessage(result.message);
    if (result.ok) setAdded(status);
  };

  const renderAddButton = (status, label) => (
    <Button
      variant="secondary"
      className="px-3"
      loading={pendingStatus === status}
      disabled={pendingStatus !== null || added === status}
      onClick={() => handleAdd(status)}
    >
      {added === status ? (
        <>
          <Check size={16} aria-hidden="true" />
          In your list
        </>
      ) : (
        label
      )}
    </Button>
  );

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}`}
      data-slide
      data-index={index}
      inert={!active}
      className="relative h-full w-full shrink-0 snap-center snap-always overflow-hidden bg-black text-white"
    >
      {image && (
        <img
          src={image}
          alt=""
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/10"
      />

      <div className="absolute left-4 top-4 flex flex-wrap gap-2 sm:left-6 sm:top-6">
        {item.averageScore != null && (
          <span className={CHIP}>
            <Star size={12} aria-hidden="true" />
            <span className="sr-only">Score </span>
            {(item.averageScore / 10).toFixed(1)}
          </span>
        )}
        {formatLabel(item.format) && (
          <span className={CHIP}>{formatLabel(item.format)}</span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 sm:p-6 lg:p-8">
        <h3 className="line-clamp-2 text-xl font-semibold leading-tight sm:text-2xl lg:text-3xl">
          {title}
        </h3>

        {meta && <p className="text-sm text-white/85">{meta}</p>}

        {item.genres?.length > 0 && (
          <ul className="flex flex-wrap gap-2 max-sm:hidden">
            {item.genres.map((genre) => (
              <li key={genre} className={CHIP}>
                {genre}
              </li>
            ))}
          </ul>
        )}

        {item.description && (
          <p className="line-clamp-2 max-w-2xl text-sm leading-6 text-white/85 max-sm:hidden">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            to={`/anime/${item.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-accent-emphasis bg-accent-emphasis px-3 text-sm font-medium text-on-accent transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
          >
            Details
          </Link>
          {renderAddButton("watching", "+ Watchlist")}
          {renderAddButton("plan to watch", "+ Plan to Watch")}
        </div>

        <p aria-live="polite" className="min-h-5 text-sm">
          {message && (
            <span className="rounded bg-black/70 px-2 py-1">{message}</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default FeaturedSlide;
