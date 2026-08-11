export type ThemeName = "qq" | "wechat";

export const THEME_STORAGE_KEY = "qq-codex.theme";

type ThemeReader = Pick<Storage, "getItem">;
type ThemeWriter = Pick<Storage, "setItem">;

export function readThemePreference(storage: ThemeReader): ThemeName {
  try {
    return storage.getItem(THEME_STORAGE_KEY) === "wechat" ? "wechat" : "qq";
  } catch {
    return "qq";
  }
}

export function writeThemePreference(storage: ThemeWriter, theme: ThemeName): boolean {
  try {
    storage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}
