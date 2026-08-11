import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../../src/renderer/App";

describe("QQ Codex shell", () => {
  it("exposes the three primary work areas", () => {
    render(<App />);

    expect(screen.getByRole("navigation", { name: "项目与任务" })).toBeVisible();
    expect(screen.getByRole("main", { name: "Codex 对话" })).toBeVisible();
    expect(screen.getByRole("complementary", { name: "工作区检查器" })).toBeVisible();
  });
});
