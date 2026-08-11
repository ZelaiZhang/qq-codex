// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { DesktopController } from "../../src/main/DesktopController";
import type { CodexGateway } from "../../src/main/codex/CodexGateway";
import type { SessionEvent, TaskSummary, Workspace } from "../../src/domain/types";

class FakeGateway implements CodexGateway {
  listener: ((event: SessionEvent) => void) | null = null;
  startThread = vi.fn(async () => ({ threadId: "thread-1" }));
  resumeThread = vi.fn(async () => undefined);
  run = vi.fn(async () => undefined);
  stop = vi.fn(async () => undefined);
  respondToApproval = vi.fn(async () => undefined);
  initialize = vi.fn(async () => undefined);
  dispose = vi.fn(async () => undefined);
  onEvent(listener: (event: SessionEvent) => void): () => void {
    this.listener = listener;
    return () => { this.listener = null; };
  }
}

const workspace: Workspace = {
  id: "workspace-1",
  name: "demo",
  path: "C:\\work\\demo",
  lastOpenedAt: "2026-08-11T00:00:00.000Z",
};

const task: TaskSummary = {
  id: "task-1",
  threadId: "thread-1",
  workspaceId: workspace.id,
  title: "新任务",
  updatedAt: "2026-08-11T00:00:00.000Z",
};

describe("DesktopController", () => {
  it("creates a real Codex thread and persists the task", async () => {
    const gateway = new FakeGateway();
    const store = {
      addWorkspace: vi.fn(async () => workspace),
      addTask: vi.fn(async () => task),
    };
    const controller = new DesktopController(gateway, store as never);

    await expect(controller.createTask(workspace.path)).resolves.toEqual(task);
    expect(gateway.startThread).toHaveBeenCalledWith({ cwd: workspace.path });
    expect(store.addTask).toHaveBeenCalledWith({
      workspaceId: workspace.id,
      threadId: "thread-1",
      title: "新任务",
    });
  });

  it("adds the user message before starting a turn", async () => {
    const gateway = new FakeGateway();
    const store = { getTask: vi.fn(async () => task) };
    const controller = new DesktopController(gateway, store as never);
    const listener = vi.fn();
    controller.onEvent(listener);

    await controller.sendMessage(task.id, "检查项目");

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      type: "user.message",
      message: expect.objectContaining({ role: "user", text: "检查项目" }),
    }));
    expect(gateway.run).toHaveBeenCalledWith({ threadId: "thread-1", prompt: "检查项目" });
  });
});
