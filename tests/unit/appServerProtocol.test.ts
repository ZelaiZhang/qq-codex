import { describe, expect, it, vi } from "vitest";
import { JsonLineProtocol } from "../../src/main/codex/JsonLineProtocol";
import { normalizeCodexMessage } from "../../src/main/codex/normalizeCodexEvent";

describe("JsonLineProtocol", () => {
  it("correlates a JSON-RPC response with its request", async () => {
    const writes: string[] = [];
    const protocol = new JsonLineProtocol((line) => writes.push(line));

    const pending = protocol.request("initialize", { clientInfo: { name: "qq-codex" } });
    expect(JSON.parse(writes[0])).toMatchObject({ id: 1, method: "initialize" });

    protocol.acceptLine(JSON.stringify({ id: 1, result: { ready: true } }));
    await expect(pending).resolves.toEqual({ ready: true });
  });

  it("forwards server notifications and requests", () => {
    const listener = vi.fn();
    const protocol = new JsonLineProtocol(() => undefined);
    protocol.onMessage(listener);

    protocol.acceptLine(JSON.stringify({ method: "turn/started", params: { turn: { id: "t1" } } }));
    protocol.acceptLine(JSON.stringify({ id: 7, method: "item/fileChange/requestApproval", params: {} }));

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0]).toMatchObject({ id: 7, method: "item/fileChange/requestApproval" });
  });
});

describe("normalizeCodexMessage", () => {
  it("normalizes assistant text deltas", () => {
    expect(normalizeCodexMessage({
      method: "item/agentMessage/delta",
      params: { threadId: "th1", turnId: "turn1", itemId: "item1", delta: "你好" },
    })).toEqual([{ type: "assistant.delta", turnId: "turn1", delta: "你好" }]);
  });

  it("normalizes command approvals", () => {
    expect(normalizeCodexMessage({
      id: 12,
      method: "item/commandExecution/requestApproval",
      params: { threadId: "th1", turnId: "turn1", itemId: "cmd1", command: "npm test", reason: null },
    })).toEqual([{
      type: "approval.requested",
      approval: {
        id: "command-cmd1",
        requestId: 12,
        kind: "command",
        title: "运行命令",
        detail: "npm test",
      },
    }]);
  });

  it("normalizes turn lifecycle and output events", () => {
    expect(normalizeCodexMessage({
      method: "turn/started",
      params: { threadId: "th1", turn: { id: "turn1" } },
    })).toEqual([{ type: "turn.started", turnId: "turn1" }]);

    expect(normalizeCodexMessage({
      method: "item/commandExecution/outputDelta",
      params: { threadId: "th1", turnId: "turn1", itemId: "cmd1", delta: "PASS\n" },
    })).toEqual([{
      type: "command.output",
      entry: { id: "cmd1", stream: "stdout", text: "PASS\n" },
    }]);

    expect(normalizeCodexMessage({
      method: "turn/completed",
      params: { threadId: "th1", turn: { id: "turn1", status: "completed", error: null } },
    })).toEqual([{ type: "turn.completed", turnId: "turn1" }]);
  });

  it("normalizes aggregated diffs", () => {
    expect(normalizeCodexMessage({
      method: "turn/diff/updated",
      params: { threadId: "th1", turnId: "turn1", diff: "diff --git a/a.ts b/a.ts" },
    })).toEqual([{
      type: "file.changed",
      change: {
        id: "diff-turn1",
        path: "本回合修改",
        diff: "diff --git a/a.ts b/a.ts",
        status: "applied",
      },
    }]);
  });

  it("keeps unknown notifications visible", () => {
    expect(normalizeCodexMessage({ method: "future/event", params: {} })).toEqual([
      { type: "system.notice", message: "Codex 事件：future/event" },
    ]);
  });
});
