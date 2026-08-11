import { describe, expect, it } from "vitest";
import { initialSession, sessionReducer } from "../../src/domain/sessionReducer";

describe("sessionReducer", () => {
  it("streams assistant text into one active message", () => {
    const started = sessionReducer(initialSession, { type: "turn.started", turnId: "turn-1" });
    const first = sessionReducer(started, { type: "assistant.delta", turnId: "turn-1", delta: "你" });
    const second = sessionReducer(first, { type: "assistant.delta", turnId: "turn-1", delta: "好" });

    expect(second.messages).toHaveLength(1);
    expect(second.messages[0]).toMatchObject({
      role: "assistant",
      text: "你好",
      streaming: true,
      turnId: "turn-1",
    });
  });

  it("completes the active assistant message", () => {
    const state = sessionReducer(
      sessionReducer(
        sessionReducer(initialSession, { type: "turn.started", turnId: "turn-1" }),
        { type: "assistant.delta", turnId: "turn-1", delta: "完成" },
      ),
      { type: "turn.completed", turnId: "turn-1" },
    );

    expect(state.activeTurnId).toBeNull();
    expect(state.messages[0].streaming).toBe(false);
  });

  it("tracks an approval until a decision is recorded", () => {
    const requested = sessionReducer(initialSession, {
      type: "approval.requested",
      approval: {
        id: "approval-1",
        requestId: 8,
        kind: "command",
        title: "运行 npm test",
        detail: "npm test",
      },
    });
    const resolved = sessionReducer(requested, {
      type: "approval.resolved",
      approvalId: "approval-1",
      decision: "accept",
    });

    expect(requested.approvals["approval-1"].status).toBe("pending");
    expect(resolved.approvals["approval-1"].status).toBe("accepted");
  });

  it("preserves terminal output ordering", () => {
    const first = sessionReducer(initialSession, {
      type: "command.output",
      entry: { id: "line-1", stream: "stdout", text: "one" },
    });
    const second = sessionReducer(first, {
      type: "command.output",
      entry: { id: "line-2", stream: "stderr", text: "two" },
    });

    expect(second.terminal.map((entry) => entry.text)).toEqual(["one", "two"]);
  });
});
