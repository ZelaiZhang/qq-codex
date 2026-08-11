import type { SessionEvent } from "../../domain/types";
import type { CodexGateway, ProtocolClient } from "./CodexGateway";
import { normalizeCodexMessage } from "./normalizeCodexEvent";

type ThreadResponse = { thread?: { id?: string } };
type TurnResponse = { turn?: { id?: string } };

export class AppServerCodexGateway implements CodexGateway {
  private readonly listeners = new Set<(event: SessionEvent) => void>();
  private readonly activeTurns = new Map<string, string>();
  private readonly unsubscribeProtocol: () => void;

  constructor(private readonly protocol: ProtocolClient) {
    this.unsubscribeProtocol = protocol.onMessage((message) => {
      for (const event of normalizeCodexMessage(message)) {
        if (event.type === "turn.started") {
          const params = message.params as { threadId?: string } | undefined;
          if (params?.threadId) this.activeTurns.set(params.threadId, event.turnId);
        }
        if (event.type === "turn.completed" || event.type === "turn.failed") {
          const params = message.params as { threadId?: string } | undefined;
          if (params?.threadId) this.activeTurns.delete(params.threadId);
        }
        for (const listener of this.listeners) listener(event);
      }
    });
  }

  async initialize(): Promise<void> {
    await this.protocol.request("initialize", {
      clientInfo: { name: "qq-codex", title: "QQ Codex", version: "0.1.0" },
      capabilities: {
        experimentalApi: true,
        requestAttestation: false,
      },
    });
    this.protocol.notify("initialized");
  }

  async startThread(input: { cwd: string }): Promise<{ threadId: string }> {
    const response = await this.protocol.request("thread/start", {
      cwd: input.cwd,
      approvalPolicy: "on-request",
      approvalsReviewer: "user",
      sandbox: "workspace-write",
    }) as ThreadResponse;
    const threadId = response.thread?.id;
    if (!threadId) throw new Error("Codex 未返回任务标识");
    return { threadId };
  }

  async resumeThread(input: { cwd: string; threadId: string }): Promise<void> {
    await this.protocol.request("thread/resume", {
      threadId: input.threadId,
      cwd: input.cwd,
      approvalPolicy: "on-request",
      approvalsReviewer: "user",
      sandbox: "workspace-write",
    });
  }

  async run(input: { threadId: string; prompt: string }): Promise<void> {
    const response = await this.protocol.request("turn/start", {
      threadId: input.threadId,
      input: [{ type: "text", text: input.prompt, text_elements: [] }],
    }) as TurnResponse;
    const turnId = response.turn?.id;
    if (!turnId) throw new Error("Codex 未返回回合标识");
    this.activeTurns.set(input.threadId, turnId);
  }

  async stop(threadId: string): Promise<void> {
    const turnId = this.activeTurns.get(threadId);
    if (!turnId) return;
    await this.protocol.request("turn/interrupt", { threadId, turnId });
    this.activeTurns.delete(threadId);
  }

  async respondToApproval(input: {
    requestId: string | number;
    decision: "accept" | "decline";
  }): Promise<void> {
    this.protocol.respond(input.requestId, { decision: input.decision });
  }

  onEvent(listener: (event: SessionEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async dispose(): Promise<void> {
    this.unsubscribeProtocol();
    await this.protocol.dispose();
    this.listeners.clear();
    this.activeTurns.clear();
  }
}
