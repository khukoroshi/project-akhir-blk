import { useState } from "react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import { Bookmark, Check, Play, Star } from "../../components/common/icons";
import {
  formatLabel,
  getAnimeTitle,
  statusLabel,
} from "../../utils/animeLabels";
import useAddToList from "../watchlist/useAddToList";
import AnimeScoreCard from "./AnimeScoreCard";
import ComingSoonButton from "./ComingSoonButton";

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

      {/* Below lg: one centered column. From lg: poster | text | score card. */}
      <div className="relative flex flex-col items-center gap-4 px-4 sm:px-6 md:flex-row md:justify-center md:gap-6 md:flex-nowrap lg:items-start">
        {/* Poster hangs over the banner; self-start stops it stretching */}
        <div className="relative z-10 -mt-24 w-32 shrink-0 space-y-3 self-center sm:-mt-32 sm:w-44 lg:-mt-40 lg:w-56 lg:self-start">
          <div className="overflow-hidden rounded-md border border-border bg-subtle">
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

          <div className="flex gap-2">
            <ComingSoonButton label="Watch trailer" variant="danger">
              <Play size={18} aria-hidden="true" />
            </ComingSoonButton>
            <ComingSoonButton
              label="Bookmark"
              variant="secondary"
              className="text-accent"
            >
              <Bookmark size={18} aria-hidden="true" />
            </ComingSoonButton>
          </div>
        </div>

        <div className="min-w-0 lg:flex-1 space-y-3 text-center lg:pt-4 md:text-left md:flex-initial">
          <h1 className="wrap-break-word text-2xl font-semibold leading-tight text-fg sm:text-3xl">
            {title}
          </h1>

          {alternatives.length > 0 && (
            <p className="wrap-break-word text-sm text-muted">
              {alternatives.join(" · ")}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            {format && <Badge>{format}</Badge>}
            {anime.status && (
              <Badge tone={STATUS_TONES[anime.status] ?? "neutral"}>
                {statusLabel(anime.status)}
              </Badge>
            )}
            {anime.averageScore != null && (
              <Badge className="lg:hidden">
                <Star size={12} aria-hidden="true" />
                <span className="sr-only">Score </span>
                {(anime.averageScore / 10).toFixed(1)}
              </Badge>
            )}
          </div>

          {anime.genres?.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-2 md:justify-start">
              {anime.genres.map((genre) => (
                <li key={genre}>
                  <Badge tone="accent">{genre}</Badge>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap justify-center gap-2 pt-1 md:justify-start">
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

        {/* Laptop only; below lg the small score badge above is used instead */}
        <AnimeScoreCard
          averageScore={anime.averageScore}
          className="hidden w-52 shrink-0 lg:flex absolute lg:right-8 top-1/2 -translate-y-1/2"
        />
      </div>
    </header>
  );
}

export default AnimeHero;
