import cx from "../../utils/cx";

const TONES = {
  neutral: "border-border text-fg",
  accent: "border-accent/40 text-accent",
  success: "border-success/40 text-success",
  attention: "border-attention/40 text-attention",
  danger: "border-danger/40 text-danger",
};

export default function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border bg-subtle px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
