import { randomUUID } from "node:crypto";
import type { SessionEvent, TaskSummary, Workspace } from "../domain/types";
import type { CodexGateway } from "./codex/CodexGateway";
import type { WorkspaceStore } from "./workspaces/WorkspaceStore";

type Store = Pick<
  WorkspaceStore,
  "addWorkspace" | "addTask" | "getTask" | "getWorkspace" | "listWorkspaces" | "listTasks" | "renameTask"
>;

export class DesktopController {
  private readonly listeners = new Set<(event: SessionEvent) => void>();
  private readonly unsubscribeGateway: () => void;

  constructor(
    private readonly gateway: CodexGateway,
    private readonly store: Store,
  ) {
    this.unsubscribeGateway = gateway.onEvent((event) => this.emit(event));
  }

  initialize(): Promise<void> {
    return this.gateway.initialize();
  }

  listWorkspaces(): Promise<Workspace[]> {
    return this.store.listWorkspaces();
  }

  listTasks(workspaceId?: string): Promise<TaskSummary[]> {
    return this.store.listTasks(workspaceId);
  }

  async createTask(cwd: string): Promise<TaskSummary> {
    const workspace = await this.store.addWorkspace(cwd);
    const { threadId } = await this.gateway.startThread({ cwd: workspace.path });
    return this.store.addTask({ workspaceId: workspace.id, threadId, title: "新任务" });
  }

  async resumeTask(taskId: string): Promise<void> {
    const task = await this.requireTask(taskId);
    const workspace = await this.store.getWorkspace(task.workspaceId);
    if (!workspace) throw new Error("任务关联的工作区不存在");
    await this.gateway.resumeThread({ threadId: task.threadId, cwd: workspace.path });
  }

  renameTask(taskId: string, title: string): Promise<void> {
    return this.store.renameTask(taskId, title);
  }

  async sendMessage(taskId: string, prompt: string): Promise<void> {
    const task = await this.requireTask(taskId);
    this.emit({
      type: "user.message",
      message: {
        id: randomUUID(),
        role: "user",
        text: prompt,
        streaming: false,
      },
    });
    await this.gateway.run({ threadId: task.threadId, prompt });
  }

  async stopTurn(taskId: string): Promise<void> {
    const task = await this.requireTask(taskId);
    await this.gateway.stop(task.threadId);
  }

  respondToApproval(requestId: string | number, decision: "accept" | "decline"): Promise<void> {
    return this.gateway.respondToApproval({ requestId, decision });
  }

  onEvent(listener: (event: SessionEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async dispose(): Promise<void> {
    this.unsubscribeGateway();
    this.listeners.clear();
    await this.gateway.dispose();
  }

  private emit(event: SessionEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  private async requireTask(taskId: string): Promise<TaskSummary> {
    const task = await this.store.getTask(taskId);
    if (!task) throw new Error("找不到 Codex 任务");
    return task;
  }
}
