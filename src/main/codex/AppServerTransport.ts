import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import type { ProtocolClient } from "./CodexGateway";
import { JsonLineProtocol } from "./JsonLineProtocol";

const require = createRequire(import.meta.url);

export class AppServerTransport implements ProtocolClient {
  private readonly protocol: JsonLineProtocol;
  private stderrTail = "";

  private constructor(private readonly child: ChildProcessWithoutNullStreams) {
    this.protocol = new JsonLineProtocol((line) => child.stdin.write(line));
    const lines = createInterface({ input: child.stdout });
    lines.on("line", (line) => this.protocol.acceptLine(line));
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      this.stderrTail = `${this.stderrTail}${chunk}`.slice(-4_000);
    });
    child.on("error", (error) => this.protocol.close(`无法启动 Codex：${error.message}`));
    child.on("exit", (code) => {
      const detail = this.stderrTail.trim();
      this.protocol.close(detail || `Codex App Server 已退出（代码 ${code ?? "未知"}）`);
    });
  }

  static async start(): Promise<AppServerTransport> {
    const packageJson = require.resolve("@openai/codex/package.json");
    const entrypoint = join(dirname(packageJson), "bin", "codex.js");
    const child = spawn(process.execPath, [entrypoint, "app-server", "--listen", "stdio://"], {
      cwd: process.cwd(),
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return new AppServerTransport(child);
  }

  request(method: string, params: unknown): Promise<unknown> {
    return this.protocol.request(method, params);
  }

  notify(method: string, params?: unknown): void {
    this.protocol.notify(method, params);
  }

  respond(id: string | number, result: unknown): void {
    this.protocol.respond(id, result);
  }

  onMessage(listener: (message: Record<string, unknown>) => void): () => void {
    return this.protocol.onMessage(listener);
  }

  async dispose(): Promise<void> {
    if (this.child.exitCode !== null) return;
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        this.child.kill();
        resolve();
      }, 2_000);
      this.child.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
      this.child.kill();
    });
  }
}
