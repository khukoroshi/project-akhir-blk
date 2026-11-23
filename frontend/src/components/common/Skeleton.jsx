import cx from "../../utils/cx";

export default function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "animate-pulse rounded-md bg-border/60 motion-reduce:animate-none",
        className,
      )}
    />
  );
}
