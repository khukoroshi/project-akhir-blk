import { useCallback, useEffect, useRef, useState } from "react";

import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Skeleton from "../../components/common/Skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "../../components/common/icons";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";
import cx from "../../utils/cx";
import FeaturedSlide from "./FeaturedSlide";

const AUTOPLAY_MS = 6000;
const SLIDES_HEIGHT = "h-72 sm:h-80 lg:h-96";
const ICON_BTN =
  "flex size-11 items-center justify-center rounded-md text-fg transition-colors hover:bg-border/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none";

function FeaturedCarousel({ items, loading, error, onRetry }) {
  const count = items.length;
  const reducedMotion = usePrefersReducedMotion();
  const scrollerRef = useRef(null);

  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  const playing =
    count > 1 &&
    !reducedMotion &&
    !userPaused &&
    !hovered &&
    !focused &&
    !tabHidden;

  const scrollToIndex = useCallback(
    (index) => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTo({
        left: index * el.clientWidth,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    },
    [reducedMotion],
  );

  const go = (index) => scrollToIndex(((index % count) + count) % count);

  // Track the visible slide.
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number(entry.target.dataset.index));
          }
        }
      },
      { root, threshold: 0.6 },
    );

    root.querySelectorAll("[data-slide]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [count]);

  // Autoplay: one timeout per slide; restarts whenever the active slide changes.
  useEffect(() => {
    if (!playing) return undefined;
    const id = setTimeout(
      () => scrollToIndex((active + 1) % count),
      AUTOPLAY_MS,
    );
    return () => clearTimeout(id);
  }, [playing, active, count, scrollToIndex]);

  // Pause while the tab is hidden.
  useEffect(() => {
    const onChange = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-md border border-border">
        <span role="status" className="sr-only">
          Loading featured anime
        </span>
        <Skeleton className={cx("w-full rounded-none", SLIDES_HEIGHT)} />
        <div className="h-11 border-t border-border bg-subtle" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center sm:min-h-80 lg:min-h-96">
        <p className="text-lg font-semibold text-fg">
          Could not load featured anime
        </p>
        <p className="max-w-md text-sm text-muted">{error}</p>
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </Card>
    );
  }

  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Currently airing anime"
      className="overflow-hidden rounded-md border border-border bg-subtle"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={(e) => {
        // Only keyboard focus holds autoplay; a mouse click should not.
        if (e.target.matches(":focus-visible")) setFocused(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(active + 1);
        else if (e.key === "ArrowLeft") go(active - 1);
      }}
    >
      <div
        ref={scrollerRef}
        aria-live={playing ? "off" : "polite"}
        onTouchStart={() => setUserPaused(true)}
        className={cx(
          "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          SLIDES_HEIGHT,
        )}
      >
        {items.map((item, index) => (
          <FeaturedSlide
            key={item.id}
            item={item}
            index={index}
            total={count}
            active={index === active}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-2">
        {reducedMotion || count < 2 ? (
          <span className="size-11" aria-hidden="true" />
        ) : (
          <button
            type="button"
            aria-pressed={userPaused}
            aria-label="Pause autoplay"
            onClick={() => setUserPaused((v) => !v)}
            className={ICON_BTN}
          >
            {userPaused ? (
              <Play size={18} aria-hidden="true" />
            ) : (
              <Pause size={18} aria-hidden="true" />
            )}
          </button>
        )}

        <div className="flex flex-1 items-center justify-center">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Slide ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => go(index)}
              className="group flex h-11 w-6 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span
                className={cx(
                  "block h-2 rounded-full transition-all motion-reduce:transition-none",
                  index === active
                    ? "w-5 bg-accent"
                    : "w-2 bg-border-strong group-hover:bg-muted",
                )}
              />
            </button>
          ))}
        </div>

        {/* Visible from lg up; below lg hidden visually but still focusable. */}
        <div className="flex max-lg:sr-only max-lg:focus-within:not-sr-only">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(active - 1)}
            className={ICON_BTN}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(active + 1)}
            className={ICON_BTN}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeaturedCarousel;
