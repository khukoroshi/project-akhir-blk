import { useState } from "react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import { Check, Star } from "../../components/common/icons";
import {
  formatLabel,
  getAnimeTitle,
  statusLabel,
} from "../../utils/animeLabels";
import useAddToList from "../watchlist/useAddToList";

const STATUS_TONES = {
  RELEASING: "success",
  NOT_YET_RELEASED: "attention",
  CANCELLED: "danger",
};

// coverImage.color comes from an external API and goes into a style attribute.
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function getAlternativeTitles(title, mainTitle) {
  const seen = new Set([mainTitle]);
  return [title?.english, title?.native].filter((value) => {
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function AnimeHero({ anime }) {
  const { addToList, pendingStatus } = useAddToList();
  const [added, setAdded] = useState(null); // status that was added
  const [feedback, setFeedback] = useState(null); // { ok, text }

  const title = getAnimeTitle(anime.title);
  const alternatives = getAlternativeTitles(anime.title, title);
  const poster = anime.coverImage?.extraLarge || anime.coverImage?.large;
  const color = HEX_COLOR.test(anime.coverImage?.color ?? "")
    ? anime.coverImage.color
    : null;
  const format = formatLabel(anime.format);

  const handleAdd = async (status) => {
    setFeedback(null);
    const result = await addToList(anime.id, status, title);
    if (!result) return;

    if (result.ok) {
      setAdded(status);
      setFeedback({ ok: true, text: result.message });
    } else if (result.alreadyInList) {
      setAdded(status);
      setFeedback({ ok: true, text: `${title} is already in your list.` });
    } else {
      setFeedback({ ok: false, text: result.message });
    }
  };

  const renderAddButton = (status, label, variant) => (
    <Button
      variant={variant}
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
    <header>
      {/* Banner strip: fixed height, so nothing shifts when it loads */}
      <div
        className="relative h-40 overflow-hidden rounded-md bg-subtle sm:h-56 lg:h-64"
        style={
          !anime.bannerImage && color
            ? {
                backgroundImage: `linear-gradient(to bottom right, ${color}59, transparent)`,
              }
            : undefined
        }
      >
        {anime.bannerImage && (
          <img
            src={anime.bannerImage}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-canvas to-transparent"
        />
      </div>

      <div className="flex flex-col gap-4 px-4 sm:px-6 lg:flex-row lg:gap-6">
        {/* Poster hangs over the banner (negative margin on the poster only) */}
        <div className="relative z-10 -mt-24 w-32 shrink-0 overflow-hidden rounded-md border border-border bg-subtle sm:-mt-32 sm:w-44 lg:-mt-40 lg:w-56">
          <div className="aspect-[2/3]">
            {poster && (
              <img
                src={poster}
                alt={title}
                loading="eager"
                decoding="async"
                className="size-full object-cover"
              />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3 lg:pt-4">
          <h1 className="wrap-break-word text-2xl font-semibold leading-tight text-fg sm:text-3xl">
            {title}
          </h1>

          {alternatives.length > 0 && (
            <p className="wrap-break-word text-sm text-muted">
              {alternatives.join(" · ")}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {format && <Badge>{format}</Badge>}
            {anime.status && (
              <Badge tone={STATUS_TONES[anime.status] ?? "neutral"}>
                {statusLabel(anime.status)}
              </Badge>
            )}
            {anime.averageScore != null && (
              <Badge>
                <Star size={12} aria-hidden="true" />
                <span className="sr-only">Score </span>
                {(anime.averageScore / 10).toFixed(1)}
              </Badge>
            )}
          </div>

          {anime.genres?.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {anime.genres.map((genre) => (
                <li key={genre}>
                  <Badge tone="accent">{genre}</Badge>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {renderAddButton("watching", "+ Watchlist", "primary")}
            {renderAddButton("plan to watch", "+ Plan to Watch", "secondary")}
          </div>

          <p
            aria-live="polite"
            className={`min-h-5 text-sm ${
              feedback && !feedback.ok ? "text-danger" : "text-muted"
            }`}
          >
            {feedback?.text}
          </p>
        </div>
      </div>
    </header>
  );
}

export default AnimeHero;
