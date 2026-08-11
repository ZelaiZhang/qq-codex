import { useLayoutEffect, useState } from "react";
import {
  readThemePreference,
  type ThemeName,
  writeThemePreference,
} from "./themePreference";

export function useThemePreference(): readonly [ThemeName, (theme: ThemeName) => void] {
  const [theme, setThemeState] = useState<ThemeName>(() =>
    readThemePreference(window.localStorage));

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = (nextTheme: ThemeName) => {
    writeThemePreference(window.localStorage, nextTheme);
    setThemeState(nextTheme);
  };

  return [theme, setTheme] as const;
}
