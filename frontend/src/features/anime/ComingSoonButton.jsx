import { useEffect, useId, useRef, useState } from "react";

import Button from "../../components/common/Button";

const MESSAGE = "Coming soon";
const HIDE_AFTER_MS = 2000;

// Placeholder icon button: shows a tooltip on hover, focus, and tap.
function ComingSoonButton({
  label,
  variant = "secondary",
  className = "",
  children,
}) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = () => setOpen(true);
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };
  // Tap/click: keep the tooltip visible for a moment (touch has no hover).
  const handleClick = () => {
    clearTimeout(timer.current);
    setOpen(true);
    timer.current = setTimeout(() => setOpen(false), HIDE_AFTER_MS);
  };

  return (
    <span className="relative flex-1" onMouseEnter={show} onMouseLeave={hide}>
      <Button
        variant={variant}
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        className={`w-full px-0 ${className}`}
        onClick={handleClick}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </Button>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-fg px-2 py-1 text-xs font-medium text-canvas"
        >
          {MESSAGE}
        </span>
      )}
    </span>
  );
}

export default ComingSoonButton;
