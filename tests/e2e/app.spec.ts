import { _electron as electron, expect, test } from "@playwright/test";
import { resolve } from "node:path";

test("packaged QQ Codex starts its bundled App Server", async () => {
  const application = await electron.launch({
    executablePath: resolve("release/win-unpacked/QQ Codex.exe"),
  });
  try {
    const window = await application.firstWindow();
    await expect(window).toHaveTitle("QQ Codex");
    await expect(window.getByText("Codex 在线", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(window.getByRole("navigation", { name: "项目与任务" })).toBeVisible();
  } finally {
    await application.close();
  }
});
