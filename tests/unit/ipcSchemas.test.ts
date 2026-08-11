import { describe, expect, it } from "vitest";
import { approvalResponseSchema, createTaskSchema, sendMessageSchema } from "../../src/shared/ipcSchemas";

describe("IPC schemas", () => {
  it("rejects a relative workspace path", () => {
    expect(createTaskSchema.safeParse({ cwd: "demo/project" }).success).toBe(false);
  });

  it("trims a valid prompt and rejects an empty prompt", () => {
    expect(sendMessageSchema.parse({ taskId: "task-1", prompt: "  检查项目  " }).prompt).toBe("检查项目");
    expect(sendMessageSchema.safeParse({ taskId: "task-1", prompt: "   " }).success).toBe(false);
  });

  it("rejects approval identifiers with control characters", () => {
    expect(approvalResponseSchema.safeParse({ requestId: "ok-1", decision: "accept" }).success).toBe(true);
    expect(approvalResponseSchema.safeParse({ requestId: "bad\n1", decision: "accept" }).success).toBe(false);
  });
});
