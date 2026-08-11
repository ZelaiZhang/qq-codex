import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { WorkspaceEntry } from "../../domain/types";

const ignored = new Set([".git", "node_modules", "dist", "build", "release", ".worktrees"]);

export async function listWorkspaceEntries(root: string, limit = 500): Promise<WorkspaceEntry[]> {
  const output: WorkspaceEntry[] = [];

  async function visit(directory: string, prefix: string, depth: number): Promise<void> {
    if (depth > 8 || output.length >= limit) return;
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (output.length >= limit || ignored.has(entry.name) || entry.isSymbolicLink()) continue;
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        output.push({ path: relativePath, kind: "directory" });
        await visit(join(directory, entry.name), relativePath, depth + 1);
      } else if (entry.isFile()) {
        output.push({ path: relativePath, kind: "file" });
      }
    }
  }

  await visit(root, "", 0);
  return output;
}
