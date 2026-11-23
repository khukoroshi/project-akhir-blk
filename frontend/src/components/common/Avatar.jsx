import { useState } from "react";
import cx from "../../utils/cx";

const SIZES = {
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-16 text-xl",
};

function getInitials(name) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

export default function Avatar({ src, name, size = "md", className = "" }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-subtle font-semibold text-fg",
        SIZES[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name ?? ""}
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span aria-label={name || undefined}>{getInitials(name)}</span>
      )}
    </span>
  );
}
