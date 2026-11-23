import { useSyncExternalStore } from "react";
import {
  getResolvedTheme,
  getThemeMode,
  setThemeMode,
  subscribeTheme,
  DEFAULT_MODE,
} from "../utils/theme";

export default function useTheme() {
  const mode = useSyncExternalStore(
    subscribeTheme,
    getThemeMode,
    () => DEFAULT_MODE,
  );
  const resolvedTheme = useSyncExternalStore(
    subscribeTheme,
    getResolvedTheme,
    () => "light",
  );
  return { mode, resolvedTheme, setMode: setThemeMode };
}
