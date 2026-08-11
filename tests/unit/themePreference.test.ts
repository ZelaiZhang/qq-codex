import { describe, expect, it, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  readThemePreference,
  writeThemePreference,
} from "../../src/renderer/theme/themePreference";

describe("theme preference", () => {
  it("defaults to the QQ theme when no preference exists", () => {
    const storage = { getItem: vi.fn(() => null) };

    expect(readThemePreference(storage)).toBe("qq");
    expect(storage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
  });

  it("restores a valid WeChat preference", () => {
    const storage = { getItem: vi.fn(() => "wechat") };

    expect(readThemePreference(storage)).toBe("wechat");
  });

  it("falls back to QQ for invalid or inaccessible storage", () => {
    expect(readThemePreference({ getItem: () => "purple" })).toBe("qq");
    expect(readThemePreference({ getItem: () => { throw new Error("blocked"); } })).toBe("qq");
  });

  it("persists the selected theme and tolerates inaccessible storage", () => {
    const storage = { setItem: vi.fn() };

    expect(writeThemePreference(storage, "wechat")).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, "wechat");
    expect(writeThemePreference({ setItem: () => { throw new Error("blocked"); } }, "qq")).toBe(false);
  });
});
