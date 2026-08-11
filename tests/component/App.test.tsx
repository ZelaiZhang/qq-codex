import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../src/renderer/App";
import type { DesktopApi, SessionEvent } from "../../src/domain/types";

function createApi() {
  let eventListener: ((event: SessionEvent) => void) | null = null;
  const api: DesktopApi = {
    chooseWorkspace: vi.fn(async () => "C:\\work\\demo"),
    listWorkspaces: vi.fn(async () => [{
      id: "workspace-1",
      name: "demo",
      path: "C:\\work\\demo",
      lastOpenedAt: "2026-08-11T00:00:00.000Z",
    }]),
    listTasks: vi.fn(async () => [{
      id: "task-1",
      threadId: "thread-1",
      workspaceId: "workspace-1",
      title: "检查构建",
      updatedAt: "2026-08-11T00:00:00.000Z",
    }]),
    createTask: vi.fn(async () => ({
      id: "task-2",
      threadId: "thread-2",
      workspaceId: "workspace-1",
      title: "新任务",
      updatedAt: "2026-08-11T00:00:00.000Z",
    })),
    resumeTask: vi.fn(async () => undefined),
    renameTask: vi.fn(async () => undefined),
    sendMessage: vi.fn(async () => undefined),
    stopTurn: vi.fn(async () => undefined),
    respondToApproval: vi.fn(async () => undefined),
    listWorkspaceFiles: vi.fn(async () => [{ path: "src", kind: "directory" as const }]),
    onSessionEvent: (listener) => {
      eventListener = listener;
      return () => { eventListener = null; };
    },
    minimizeWindow: vi.fn(async () => undefined),
    toggleMaximizeWindow: vi.fn(async () => undefined),
    closeWindow: vi.fn(async () => undefined),
  };
  return { api, emit: (event: SessionEvent) => eventListener?.(event) };
}

describe("QQ Codex shell", () => {
  it("exposes the three primary work areas", async () => {
    const { api } = createApi();
    render(<App api={api} />);

    expect(screen.getByRole("navigation", { name: "项目与任务" })).toBeVisible();
    expect(screen.getByRole("main", { name: "Codex 对话" })).toBeVisible();
    expect(screen.getByRole("complementary", { name: "工作区检查器" })).toBeVisible();
    await screen.findByText("Codex 在线");
  });

  it("loads projects and tasks from the desktop bridge", async () => {
    const { api } = createApi();
    render(<App api={api} />);

    expect(await screen.findByRole("button", { name: /demo/ })).toBeVisible();
    expect(await screen.findByRole("button", { name: /检查构建/ })).toBeVisible();
  });

  it("sends a prompt to the selected Codex task", async () => {
    const user = userEvent.setup();
    const { api } = createApi();
    render(<App api={api} />);
    await screen.findByRole("button", { name: /检查构建/ });

    await user.type(screen.getByRole("textbox", { name: "给 Codex 发消息" }), "检查项目");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => expect(api.sendMessage).toHaveBeenCalledWith("task-1", "检查项目"));
  });

  it("renders streamed Codex events", async () => {
    const { api, emit } = createApi();
    render(<App api={api} />);

    act(() => {
      emit({ type: "turn.started", turnId: "turn-1" });
      emit({ type: "assistant.delta", turnId: "turn-1", delta: "正在检查" });
    });

    expect(await screen.findByText("正在检查")).toBeVisible();
  });

  it("does not reload the project list when a turn starts", async () => {
    const { api, emit } = createApi();
    render(<App api={api} />);
    await screen.findByText("Codex 在线");
    vi.mocked(api.listWorkspaces).mockClear();

    act(() => emit({ type: "turn.started", turnId: "turn-1" }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(api.listWorkspaces).not.toHaveBeenCalled();
  });
});
