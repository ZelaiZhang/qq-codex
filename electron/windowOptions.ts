import type { BrowserWindowConstructorOptions } from "electron";

export function createWindowOptions(preload: string): BrowserWindowConstructorOptions {
  return {
    width: 1420,
    height: 900,
    minWidth: 760,
    minHeight: 560,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#8fd3ff",
    show: false,
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  };
}
