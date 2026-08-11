import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { basename, dirname, normalize } from "node:path";
import type { TaskSummary, Workspace } from "../../domain/types";

interface StoreData {
  workspaces: Workspace[];
  tasks: TaskSummary[];
}

const emptyStore = (): StoreData => ({ workspaces: [], tasks: [] });

export class WorkspaceStore {
  constructor(private readonly filePath: string) {}

  async listWorkspaces(): Promise<Workspace[]> {
    return [...(await this.read()).workspaces].sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt));
  }

  async addWorkspace(path: string, openedAt = new Date()): Promise<Workspace> {
    const data = await this.read();
    const key = this.pathKey(path);
    const existing = data.workspaces.find((workspace) => this.pathKey(workspace.path) === key);
    const workspace: Workspace = existing
      ? { ...existing, path: normalize(path), lastOpenedAt: openedAt.toISOString() }
      : {
          id: randomUUID(),
          name: basename(normalize(path)) || normalize(path),
          path: normalize(path),
          lastOpenedAt: openedAt.toISOString(),
        };
    data.workspaces = existing
      ? data.workspaces.map((item) => item.id === workspace.id ? workspace : item)
      : [...data.workspaces, workspace];
    await this.write(data);
    return workspace;
  }

  async listTasks(workspaceId?: string): Promise<TaskSummary[]> {
    const tasks = (await this.read()).tasks;
    return tasks
      .filter((task) => !workspaceId || task.workspaceId === workspaceId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async addTask(input: {
    workspaceId: string;
    threadId: string;
    title: string;
  }): Promise<TaskSummary> {
    const data = await this.read();
    const task: TaskSummary = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      threadId: input.threadId,
      title: input.title,
      updatedAt: new Date().toISOString(),
    };
    data.tasks.push(task);
    await this.write(data);
    return task;
  }

  async renameTask(taskId: string, title: string): Promise<void> {
    const data = await this.read();
    const task = data.tasks.find((item) => item.id === taskId);
    if (!task) throw new Error("找不到要重命名的任务");
    task.title = title;
    task.updatedAt = new Date().toISOString();
    await this.write(data);
  }

  async getTask(taskId: string): Promise<TaskSummary | null> {
    return (await this.read()).tasks.find((task) => task.id === taskId) ?? null;
  }

  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    return (await this.read()).workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
  }

  private pathKey(path: string): string {
    return normalize(path).replaceAll("/", "\\").toLocaleLowerCase("en-US");
  }

  private async read(): Promise<StoreData> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, "utf8")) as Partial<StoreData>;
      return {
        workspaces: Array.isArray(parsed.workspaces) ? parsed.workspaces : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyStore();
      throw error;
    }
  }

  private async write(data: StoreData): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(data, null, 2), "utf8");
    await rename(temporaryPath, this.filePath);
  }
}
