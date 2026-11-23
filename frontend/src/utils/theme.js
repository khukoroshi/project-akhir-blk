export const THEME_MODES = ["system", "light", "dark"];

const STORAGE_KEY = "anisphere-theme";

export const DEFAULT_MODE = "system"; // ubah di sini; samakan juga `var mode` di index.html
const LEGACY_STORAGE_KEY = "theme";

const QUERY = "(prefers-color-scheme: dark)";
const listeners = new Set();

function isMode(value) {
  return THEME_MODES.includes(value);
}

export function readThemeMode() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isMode(value) ? value : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

function systemPrefersDark() {
  try {
    return window.matchMedia(QUERY).matches;
  } catch {
    return false;
  }
}

function resolveTheme(mode) {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

// One-time: carry over the old ThemeProvider choice ("theme") to the new key.
function migrateLegacyMode() {
  try {
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === null) return;
    if (
      window.localStorage.getItem(STORAGE_KEY) === null &&
      (legacy === "dark" || legacy === "light")
    ) {
      window.localStorage.setItem(STORAGE_KEY, legacy);
    }
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage may be blocked; nothing to migrate.
  }
}

const isBrowser = typeof window !== "undefined";
if (isBrowser) migrateLegacyMode();
let currentMode = isBrowser ? readThemeMode() : DEFAULT_MODE;
let currentResolved = isBrowser ? resolveTheme(currentMode) : "light";

function syncAttribute() {
  document.documentElement.setAttribute("data-theme", currentResolved);
}

function apply() {
  currentResolved = resolveTheme(currentMode);
  syncAttribute();
  listeners.forEach((listener) => listener());
}

export function getThemeMode() {
  return currentMode;
}

export function getResolvedTheme() {
  return currentResolved;
}

export function setThemeMode(next) {
  if (!isMode(next)) return;
  currentMode = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage may be blocked; the choice still applies for this session.
  }
  apply();
}

export function subscribeTheme(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (isBrowser) {
  syncAttribute();
  try {
    window.matchMedia(QUERY).addEventListener("change", () => {
      if (currentMode === "system") apply();
    });
  } catch {
    // Old browsers without matchMedia events: system mode updates on reload.
  }
  // Keep other tabs in sync.
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    currentMode = readThemeMode();
    apply();
  });
}
