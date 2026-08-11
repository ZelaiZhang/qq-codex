import type { SessionEvent } from "../../domain/types";

type Message = Record<string, unknown>;

function object(value: unknown): Message {
  return value && typeof value === "object" ? value as Message : {};
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function normalizeCodexMessage(message: Message): SessionEvent[] {
  const method = text(message.method);
  const params = object(message.params);

  switch (method) {
    case "item/agentMessage/delta":
      return [{ type: "assistant.delta", turnId: text(params.turnId), delta: text(params.delta) }];
    case "turn/started": {
      const turn = object(params.turn);
      return [{ type: "turn.started", turnId: text(turn.id) }];
    }
    case "turn/completed": {
      const turn = object(params.turn);
      const turnId = text(turn.id);
      const error = object(turn.error);
      return turn.status === "failed"
        ? [{ type: "turn.failed", turnId, message: text(error.message, "Codex 回合执行失败") }]
        : [{ type: "turn.completed", turnId }];
    }
    case "error": {
      const error = object(params.error);
      return [{ type: "turn.failed", turnId: text(params.turnId), message: text(error.message, "Codex 连接错误") }];
    }
    case "item/commandExecution/outputDelta":
    case "command/exec/outputDelta":
      return [{
        type: "command.output",
        entry: {
          id: text(params.itemId, text(params.processId, "command-output")),
          stream: "stdout",
          text: text(params.delta),
        },
      }];
    case "turn/diff/updated":
      return [{
        type: "file.changed",
        change: {
          id: `diff-${text(params.turnId)}`,
          path: "本回合修改",
          diff: text(params.diff),
          status: "applied",
        },
      }];
    case "item/commandExecution/requestApproval":
      return [{
        type: "approval.requested",
        approval: {
          id: `command-${text(params.itemId)}`,
          requestId: typeof message.id === "number" || typeof message.id === "string" ? message.id : text(params.itemId),
          kind: "command",
          title: "运行命令",
          detail: text(params.command, text(params.reason, "Codex 请求执行命令")),
        },
      }];
    case "item/fileChange/requestApproval":
      return [{
        type: "approval.requested",
        approval: {
          id: `file-${text(params.itemId)}`,
          requestId: typeof message.id === "number" || typeof message.id === "string" ? message.id : text(params.itemId),
          kind: "file-change",
          title: "修改文件",
          detail: text(params.reason, "Codex 请求写入工作区"),
        },
      }];
    case "thread/started":
    case "thread/status/changed":
    case "item/started":
    case "item/completed":
    case "serverRequest/resolved":
    case "remoteControl/status/changed":
      return [];
    default:
      return method ? [{ type: "system.notice", message: `Codex 事件：${method}` }] : [];
  }
}
