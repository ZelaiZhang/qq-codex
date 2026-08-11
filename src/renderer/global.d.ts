import type { DesktopApi } from "../domain/types";

declare global {
  interface Window {
    qqCodex?: DesktopApi;
  }
}

export {};
