import { LayoutGrid, List } from "./icons";
import cx from "../../utils/cx";

const OPTIONS = [
  { value: "grid", label: "Grid view", Icon: LayoutGrid },
  { value: "list", label: "List view", Icon: List },
];

const base =
  "inline-flex size-11 items-center justify-center rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const active = "border-accent-emphasis bg-accent-emphasis text-on-accent";
const idle = "border-border-strong bg-canvas text-fg hover:bg-subtle";

function ViewToggle({ view, onChange, className = "" }) {
  return (
    <div
      role="group"
      aria-label="View"
      className={cx("flex shrink-0 items-center gap-2", className)}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = view === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            aria-label={label}
            title={label}
            onClick={() => {
              if (!isActive) onChange(value);
            }}
            className={cx(base, isActive ? active : idle)}
          >
            <Icon className="size-5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

export default ViewToggle;
