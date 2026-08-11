// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { SessionEvent } from "../../src/domain/types";
import { AppServerCodexGateway } from "../../src/main/codex/AppServerCodexGateway";
import { AppServerTransport } from "../../src/main/codex/AppServerTransport";

describe.runIf(process.env.RUN_REAL_CODEX === "1")("real Codex workflow", () => {
  it("starts a thread and receives a streamed assistant response", async () => {
    const transport = await AppServerTransport.start();
    const gateway = new AppServerCodexGateway(transport);
    const events: SessionEvent[] = [];

    try {
      await gateway.initialize();
      const completion = new Promise<void>((resolve, reject) => {
        gateway.onEvent((event) => {
          events.push(event);
          if (event.type === "turn.completed") resolve();
          if (event.type === "turn.failed") reject(new Error(event.message));
        });
      });
      const { threadId } = await gateway.startThread({ cwd: process.cwd() });
      await gateway.run({
        threadId,
        prompt: "只回复：QQ Codex 连接成功。不要运行工具，不要修改文件。",
      });
      await Promise.race([
        completion,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("等待 Codex 回复超时")), 45_000)),
      ]);

      const response = events
        .filter((event): event is Extract<SessionEvent, { type: "assistant.delta" }> => event.type === "assistant.delta")
        .map((event) => event.delta)
        .join("");
      expect(response).toContain("QQ Codex");
    } finally {
      await gateway.dispose();
    }
  }, 50_000);
});
