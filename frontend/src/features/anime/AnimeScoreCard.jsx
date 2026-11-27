import { Star } from "../../components/common/icons";

const STAR_SIZE = 20;

// averageScore is 0-100. 5 stars = 100. Rounds to the nearest half star,
// but a fraction above .75 rounds up to the next whole star.
// export function toStarCount(averageScore) {
function toStarCount(averageScore) {
  const stars = averageScore / 20;
  const whole = Math.floor(stars);
  const fraction = stars - whole;
  if (fraction < 0.25) return whole;
  if (fraction > 0.75) return whole + 1;
  return whole + 0.5;
}

function AnimeScoreCard({ averageScore, className = "" }) {
  const hasScore = averageScore != null;
  const count = hasScore ? toStarCount(averageScore) : 0;

  return (
    <div
      className={`flex-col items-center gap-2 rounded-md border border-border bg-subtle px-4 py-3 ${className}`}
    >
      <p className="text-lg font-medium text-fg">
        Score {hasScore ? (averageScore / 10).toFixed(1) : "N/A"}
      </p>

      <div
        role="img"
        aria-label={`${count} out of 5 stars`}
        className="flex gap-1"
      >
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.min(Math.max(count - index, 0), 1);
          return (
            <span
              key={index}
              aria-hidden="true"
              className="relative inline-block"
              style={{ width: STAR_SIZE, height: STAR_SIZE }}
            >
              <Star size={STAR_SIZE} className="text-muted" />
              {fill > 0 && (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star
                    size={STAR_SIZE}
                    className="fill-current text-attention"
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default AnimeScoreCard;
