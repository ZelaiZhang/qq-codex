// @vitest-environment node
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { listWorkspaceEntries } from "../../src/main/workspaces/listWorkspaceEntries";

const created: string[] = [];
afterEach(async () => Promise.all(created.splice(0).map((path) => rm(path, { recursive: true, force: true }))));

describe("listWorkspaceEntries", () => {
  it("lists relative paths and skips generated dependency folders", async () => {
    const root = await mkdtemp(join(tmpdir(), "qq-codex-tree-"));
    created.push(root);
    await mkdir(join(root, "src"));
    await mkdir(join(root, "node_modules"));
    await writeFile(join(root, "src", "main.ts"), "export {};", "utf8");
    await writeFile(join(root, "node_modules", "skip.js"), "", "utf8");

    const entries = await listWorkspaceEntries(root);

    expect(entries).toContainEqual({ path: "src", kind: "directory" });
    expect(entries).toContainEqual({ path: "src/main.ts", kind: "file" });
    expect(entries.some((entry) => entry.path.includes("node_modules"))).toBe(false);
  });
});
