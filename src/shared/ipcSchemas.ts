import { isAbsolute } from "node:path";
import { z } from "zod";

const safeId = z.string().trim().min(1).max(256).regex(/^[^\u0000-\u001f\u007f]+$/u);
const absolutePath = z.string().trim().min(1).max(4_096).refine(isAbsolute, "必须使用绝对路径");

export const createTaskSchema = z.object({ cwd: absolutePath });
export const resumeTaskSchema = z.object({ taskId: safeId });
export const renameTaskSchema = z.object({ taskId: safeId, title: z.string().trim().min(1).max(120) });
export const sendMessageSchema = z.object({
  taskId: safeId,
  prompt: z.string().trim().min(1).max(20_000),
});
export const stopTurnSchema = z.object({ taskId: safeId });
export const approvalResponseSchema = z.object({
  requestId: z.union([safeId, z.number().int().nonnegative()]),
  decision: z.enum(["accept", "decline"]),
});
export const listWorkspaceFilesSchema = z.object({ cwd: absolutePath });
