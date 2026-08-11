import type { SessionEvent } from "../../domain/types";

export interface ProtocolClient {
  request(method: string, params: unknown): Promise<unknown>;
  notify(method: string, params?: unknown): void;
  respond(id: string | number, result: unknown): void;
  onMessage(listener: (message: Record<string, unknown>) => void): () => void;
  dispose(): Promise<void>;
}

export interface CodexGateway {
  initialize(): Promise<void>;
  startThread(input: { cwd: string }): Promise<{ threadId: string }>;
  resumeThread(input: { cwd: string; threadId: string }): Promise<void>;
  run(input: { threadId: string; prompt: string }): Promise<void>;
  stop(threadId: string): Promise<void>;
  respondToApproval(input: {
    requestId: string | number;
    decision: "accept" | "decline";
  }): Promise<void>;
  onEvent(listener: (event: SessionEvent) => void): () => void;
  dispose(): Promise<void>;
}
