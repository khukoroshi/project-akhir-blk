import { useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContext";

function getInitialTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (
    savedTheme === "light" ||
    savedTheme === "dark" ||
    savedTheme === "system"
  ) {
    return savedTheme;
  }

  return "system";
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  const applyTheme = (selectedTheme) => {
    const root = document.documentElement;

    const actualTheme =
      selectedTheme === "system" ? getSystemTheme() : selectedTheme;

    root.classList.toggle("dark", actualTheme === "dark");
  };

  useEffect(() => {
    localStorage.setItem("theme", theme);

    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export default ThemeProvider;
