import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BuddyList } from "../../src/renderer/features/buddy-list/BuddyList";

describe("BuddyList", () => {
  it("renames a task inline", async () => {
    const user = userEvent.setup();
    const onRenameTask = vi.fn(async () => undefined);
    render(<BuddyList
      workspaces={[]}
      tasks={[{
        id: "task-1",
        threadId: "thread-1",
        workspaceId: "workspace-1",
        title: "新任务",
        updatedAt: "2026-08-11T00:00:00.000Z",
      }]}
      selectedWorkspaceId={null}
      selectedTaskId="task-1"
      onSelectWorkspace={() => undefined}
      onSelectTask={() => undefined}
      onCreateTask={() => undefined}
      onOpenProject={() => undefined}
      onRenameTask={onRenameTask}
    />);

    await user.dblClick(screen.getByRole("button", { name: /新任务/ }));
    const input = screen.getByRole("textbox", { name: "任务名称" });
    await user.clear(input);
    await user.type(input, "修复构建{Enter}");

    expect(onRenameTask).toHaveBeenCalledWith("task-1", "修复构建");
  });

  it("filters tasks with the QQ-style search box", async () => {
    const user = userEvent.setup();
    const task = (id: string, title: string) => ({
      id,
      threadId: `thread-${id}`,
      workspaceId: "workspace-1",
      title,
      updatedAt: "2026-08-11T00:00:00.000Z",
    });
    render(<BuddyList
      workspaces={[]}
      tasks={[task("1", "修复登录"), task("2", "检查构建")]}
      selectedWorkspaceId={null}
      selectedTaskId={null}
      onSelectWorkspace={() => undefined}
      onSelectTask={() => undefined}
      onCreateTask={() => undefined}
      onOpenProject={() => undefined}
      onRenameTask={() => undefined}
    />);

    await user.type(screen.getByRole("textbox", { name: "搜索项目与任务" }), "构建");

    expect(screen.getByRole("button", { name: /检查构建/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /修复登录/ })).toBeNull();
  });
});
