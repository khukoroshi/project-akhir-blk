import cx from "../../utils/cx";

const BASE =
  "inline-flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-medium " +
  "transition-colors motion-reduce:transition-none lg:min-h-9 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const LINK_BUTTON_PRIMARY = cx(
  BASE,
  "border-accent-emphasis bg-accent-emphasis text-on-accent hover:brightness-110",
);
export const LINK_BUTTON_SECONDARY = cx(
  BASE,
  "border-border-strong bg-canvas text-fg hover:bg-border/40",
);
