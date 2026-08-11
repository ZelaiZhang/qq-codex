// @vitest-environment node
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { WorkspaceStore } from "../../src/main/workspaces/WorkspaceStore";

const created: string[] = [];

afterEach(async () => {
  await Promise.all(created.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("WorkspaceStore", () => {
  it("deduplicates a workspace and persists its latest timestamp", async () => {
    const root = await mkdtemp(join(tmpdir(), "qq-codex-store-"));
    created.push(root);
    const store = new WorkspaceStore(join(root, "state.json"));

    const first = await store.addWorkspace("C:\\work\\demo", new Date("2026-08-11T01:00:00Z"));
    const second = await store.addWorkspace("C:\\work\\demo", new Date("2026-08-11T02:00:00Z"));

    expect(second.id).toBe(first.id);
    expect(await store.listWorkspaces()).toHaveLength(1);
    expect((await store.listWorkspaces())[0].lastOpenedAt).toBe("2026-08-11T02:00:00.000Z");
    expect(JSON.parse(await readFile(join(root, "state.json"), "utf8")).workspaces).toHaveLength(1);
  });

  it("creates and renames a task", async () => {
    const root = await mkdtemp(join(tmpdir(), "qq-codex-store-"));
    created.push(root);
    const store = new WorkspaceStore(join(root, "state.json"));
    const workspace = await store.addWorkspace("C:\\work\\demo");

    const task = await store.addTask({ workspaceId: workspace.id, threadId: "thread-1", title: "新任务" });
    await store.renameTask(task.id, "排查构建失败");

    expect(await store.listTasks(workspace.id)).toMatchObject([{ title: "排查构建失败", threadId: "thread-1" }]);
  });
});
