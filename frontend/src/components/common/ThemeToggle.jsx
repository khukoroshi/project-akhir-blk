import useTheme from "../../hooks/useTheme";
import cx from "../../utils/cx";
import { Monitor, Moon, Sun } from "./icons";

const OPTIONS = [
  { value: "system", label: "Ikuti sistem", Icon: Monitor },
  { value: "light", label: "Terang", Icon: Sun },
  { value: "dark", label: "Gelap", Icon: Moon },
];

export default function ThemeToggle({ className = "" }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="group"
      aria-label="Pilih tema"
      className={cx(
        "inline-flex rounded-md border border-border-strong bg-subtle p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={() => setMode(value)}
            className={cx(
              "inline-flex size-11 items-center justify-center rounded-[5px] border lg:size-8",
              "focus-visible:outline-2 focus-visible:outline-accent",
              active
                ? "border-border bg-canvas text-accent shadow-sm"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            <Icon size={16} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
