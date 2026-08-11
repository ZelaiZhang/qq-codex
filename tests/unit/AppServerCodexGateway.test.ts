import { describe, expect, it, vi } from "vitest";
import { AppServerCodexGateway } from "../../src/main/codex/AppServerCodexGateway";
import type { ProtocolClient } from "../../src/main/codex/CodexGateway";

class FakeProtocol implements ProtocolClient {
  requests: Array<{ method: string; params: unknown }> = [];
  notifications: Array<{ method: string; params?: unknown }> = [];
  responses: Array<{ id: string | number; result: unknown }> = [];
  results: unknown[] = [];
  listener: ((message: Record<string, unknown>) => void) | null = null;

  async request(method: string, params: unknown): Promise<unknown> {
    this.requests.push({ method, params });
    return this.results.shift();
  }

  notify(method: string, params?: unknown): void {
    this.notifications.push({ method, params });
  }

  respond(id: string | number, result: unknown): void {
    this.responses.push({ id, result });
  }

  onMessage(listener: (message: Record<string, unknown>) => void): () => void {
    this.listener = listener;
    return () => { this.listener = null; };
  }

  async dispose(): Promise<void> {}
}

describe("AppServerCodexGateway", () => {
  it("initializes the rich-client protocol", async () => {
    const protocol = new FakeProtocol();
    protocol.results.push({ userAgent: "codex" });
    const gateway = new AppServerCodexGateway(protocol);

    await gateway.initialize();

    expect(protocol.requests[0]).toMatchObject({
      method: "initialize",
      params: { clientInfo: { name: "qq-codex", title: "QQ Codex" } },
    });
    expect(protocol.notifications).toEqual([{ method: "initialized", params: undefined }]);
  });

  it("starts a workspace-write thread with user approvals", async () => {
    const protocol = new FakeProtocol();
    protocol.results.push({ thread: { id: "thread-1" } });
    const gateway = new AppServerCodexGateway(protocol);

    await expect(gateway.startThread({ cwd: "C:\\work\\demo" })).resolves.toEqual({ threadId: "thread-1" });
    expect(protocol.requests[0]).toEqual({
      method: "thread/start",
      params: {
        cwd: "C:\\work\\demo",
        approvalPolicy: "on-request",
        approvalsReviewer: "user",
        sandbox: "workspace-write",
      },
    });
  });

  it("starts and interrupts a turn", async () => {
    const protocol = new FakeProtocol();
    protocol.results.push({ turn: { id: "turn-1" } }, {});
    const gateway = new AppServerCodexGateway(protocol);

    await gateway.run({ threadId: "thread-1", prompt: "检查项目" });
    await gateway.stop("thread-1");

    expect(protocol.requests).toEqual([
      {
        method: "turn/start",
        params: {
          threadId: "thread-1",
          input: [{ type: "text", text: "检查项目", text_elements: [] }],
        },
      },
      { method: "turn/interrupt", params: { threadId: "thread-1", turnId: "turn-1" } },
    ]);
  });

  it("forwards normalized events and approval decisions", async () => {
    const protocol = new FakeProtocol();
    const gateway = new AppServerCodexGateway(protocol);
    const listener = vi.fn();
    gateway.onEvent(listener);

    protocol.listener?.({
      id: 5,
      method: "item/fileChange/requestApproval",
      params: { itemId: "file-1", reason: "更新配置" },
    });
    await gateway.respondToApproval({ requestId: 5, decision: "accept" });

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: "approval.requested" }));
    expect(protocol.responses).toEqual([{ id: 5, result: { decision: "accept" } }]);
  });
});
