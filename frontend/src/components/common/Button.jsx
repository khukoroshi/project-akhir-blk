import cx from "../../utils/cx";
import { LoaderCircle } from "./icons";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md border font-medium " +
  "transition-colors motion-reduce:transition-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS = {
  primary:
    "border-accent-emphasis bg-accent-emphasis text-on-accent enabled:hover:brightness-110",
  secondary:
    "border-border-strong bg-subtle text-fg enabled:hover:bg-border/40",
  danger: "border-danger bg-transparent text-danger enabled:hover:bg-danger/10",
  ghost: "border-transparent bg-transparent text-fg enabled:hover:bg-border/40",
};

const SIZES = {
  sm: "min-h-11 px-3 text-sm lg:min-h-8",
  md: "min-h-11 px-4 text-sm lg:min-h-9",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {loading && (
        <LoaderCircle
          size={16}
          aria-hidden="true"
          className="animate-spin motion-reduce:animate-none"
        />
      )}
      {children}
    </button>
  );
}
