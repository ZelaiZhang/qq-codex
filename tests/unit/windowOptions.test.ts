// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createWindowOptions } from "../../electron/windowOptions";

describe("createWindowOptions", () => {
  it("isolates the renderer from Node", () => {
    const options = createWindowOptions("C:\\app\\preload.js");

    expect(options.webPreferences).toMatchObject({
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: "C:\\app\\preload.js",
    });
  });
});
