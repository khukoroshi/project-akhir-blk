import { useId } from "react";
import cx from "../../utils/cx";

export default function Input({
  label,
  hint,
  error,
  id,
  className = "",
  "aria-describedby": ariaDescribedBy,
  ref,
  ...props
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-fg">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          "block min-h-11 w-full rounded-md border bg-canvas px-3 text-sm text-fg lg:min-h-9",
          "placeholder:text-muted",
          "focus-visible:outline-2 focus-visible:outline-accent",
          "disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-danger" : "border-border-strong",
        )}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
