type JsonObject = Record<string, unknown>;
type MessageListener = (message: JsonObject) => void;

interface PendingRequest {
  resolve(value: unknown): void;
  reject(error: Error): void;
}

export class JsonLineProtocol {
  private nextId = 1;
  private readonly pending = new Map<number, PendingRequest>();
  private readonly listeners = new Set<MessageListener>();

  constructor(private readonly writeLine: (line: string) => void) {}

  request(method: string, params: unknown): Promise<unknown> {
    const id = this.nextId++;
    this.writeLine(`${JSON.stringify({ method, id, params })}\n`);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  notify(method: string, params?: unknown): void {
    this.writeLine(`${JSON.stringify(params === undefined ? { method } : { method, params })}\n`);
  }

  respond(id: string | number, result: unknown): void {
    this.writeLine(`${JSON.stringify({ id, result })}\n`);
  }

  onMessage(listener: MessageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  acceptLine(line: string): void {
    if (!line.trim()) return;
    const message = JSON.parse(line) as JsonObject;
    if (typeof message.id === "number" && !message.method && ("result" in message || "error" in message)) {
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      if ("error" in message) {
        request.reject(new Error(this.errorMessage(message.error)));
      } else {
        request.resolve(message.result);
      }
      return;
    }
    for (const listener of this.listeners) listener(message);
  }

  close(reason: string): void {
    for (const request of this.pending.values()) request.reject(new Error(reason));
    this.pending.clear();
  }

  private errorMessage(error: unknown): string {
    if (typeof error === "string") return error;
    if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
      return error.message;
    }
    return "Codex App Server 请求失败";
  }
}
