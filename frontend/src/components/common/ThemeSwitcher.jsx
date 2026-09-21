import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../context/useTheme";

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleThemeChange = (value) => {
    setTheme(value);
    setOpen(false);
  };

  const currentIcon = theme === "dark" ? "☾" : theme === "light" ? "☀" : "◐";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="
          flex h-9 w-9
          items-center justify-center
          rounded-lg
          text-lg
          text-slate-600
          transition

          hover:bg-slate-100
          hover:text-slate-900

          dark:text-slate-300
          dark:hover:bg-slate-800
          dark:hover:text-white
        "
        aria-label="Change theme"
        aria-expanded={open}
      >
        {currentIcon}
      </button>

      {open && (
        <div
          className="
            absolute right-0 top-full z-50 mt-2
            w-40
            overflow-hidden
            rounded-xl
            border
            border-slate-200
            bg-white
            p-1.5
            shadow-xl

            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <ThemeOption
            icon="☀"
            label="Light"
            active={theme === "light"}
            onClick={() => handleThemeChange("light")}
          />

          <ThemeOption
            icon="☾"
            label="Dark"
            active={theme === "dark"}
            onClick={() => handleThemeChange("dark")}
          />

          <ThemeOption
            icon="◐"
            label="System"
            active={theme === "system"}
            onClick={() => handleThemeChange("system")}
          />
        </div>
      )}
    </div>
  );
}

function ThemeOption({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex w-full items-center gap-3
        rounded-lg
        px-3 py-2
        text-sm
        transition

        ${
          active
            ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
            : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/70"
        }
      `}
    >
      <span className="w-5 text-center">{icon}</span>

      <span>{label}</span>

      {active && <span className="ml-auto text-xs">✓</span>}
    </button>
  );
}

export default ThemeSwitcher;
