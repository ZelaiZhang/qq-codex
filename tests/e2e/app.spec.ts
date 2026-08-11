import { _electron as electron, expect, test } from "@playwright/test";
import { resolve } from "node:path";

test("packaged QQ Codex starts App Server and persists theme changes", async () => {
  const application = await electron.launch({
    executablePath: resolve("release/win-unpacked/QQ Codex.exe"),
  });
  try {
    const window = await application.firstWindow();
    await expect(window).toHaveTitle("QQ Codex");
    await expect(window.getByText("Codex 在线", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(window.getByRole("navigation", { name: "项目与任务" })).toBeVisible();

    await window.evaluate(() => window.localStorage.clear());
    await window.reload();
    await expect(window.locator(".app-frame")).toHaveAttribute("data-theme", "qq");

    await window.getByRole("button", { name: "微信主题" }).click();
    await expect(window.locator(".app-frame")).toHaveAttribute("data-theme", "wechat");
    await expect(window.getByText("微信 Codex", { exact: true })).toBeVisible();

    await window.reload();
    await expect(window.locator(".app-frame")).toHaveAttribute("data-theme", "wechat");
    await expect(window.getByRole("button", { name: "微信主题" })).toHaveAttribute("aria-pressed", "true");
  } finally {
    await application.close();
  }
});
