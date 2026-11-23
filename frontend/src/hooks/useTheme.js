import { useSyncExternalStore } from "react";
import {
  getResolvedTheme,
  getThemeMode,
  setThemeMode,
  subscribeTheme,
} from "../utils/theme";

export default function useTheme() {
  const mode = useSyncExternalStore(
    subscribeTheme,
    getThemeMode,
    () => "system",
  );
  const resolvedTheme = useSyncExternalStore(
    subscribeTheme,
    getResolvedTheme,
    () => "light",
  );
  return { mode, resolvedTheme, setMode: setThemeMode };
}
