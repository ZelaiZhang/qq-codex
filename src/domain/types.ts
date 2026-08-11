export type ConnectionState = "connecting" | "online" | "offline" | "error";

export interface Workspace {
  id: string;
  name: string;
  path: string;
  lastOpenedAt: string;
}

export interface TaskSummary {
  id: string;
  threadId: string;
  workspaceId: string;
  title: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  turnId?: string;
  role: "user" | "assistant" | "system";
  text: string;
  streaming: boolean;
}

export interface Approval {
  id: string;
  requestId: string | number;
  kind: "command" | "file-change";
  title: string;
  detail: string;
  status: "pending" | "accepted" | "declined";
}

export interface TerminalEntry {
  id: string;
  stream: "stdout" | "stderr" | "system";
  text: string;
}

export interface FileChange {
  id: string;
  path: string;
  diff: string;
  status: "pending" | "applied" | "rejected";
}

export interface SessionState {
  activeTurnId: string | null;
  connection: ConnectionState;
  messages: ChatMessage[];
  approvals: Record<string, Approval>;
  terminal: TerminalEntry[];
  fileChanges: FileChange[];
  error: string | null;
}

export type SessionEvent =
  | { type: "connection.changed"; connection: ConnectionState }
  | { type: "user.message"; message: ChatMessage }
  | { type: "turn.started"; turnId: string }
  | { type: "assistant.delta"; turnId: string; delta: string }
  | { type: "turn.completed"; turnId: string }
  | { type: "turn.failed"; turnId: string; message: string }
  | { type: "approval.requested"; approval: Omit<Approval, "status"> }
  | { type: "approval.resolved"; approvalId: string; decision: "accept" | "decline" }
  | { type: "command.output"; entry: TerminalEntry }
  | { type: "file.changed"; change: FileChange }
  | { type: "system.notice"; message: string };

export interface WorkspaceEntry {
  path: string;
  kind: "file" | "directory";
}

export interface DesktopApi {
  chooseWorkspace(): Promise<string | null>;
  listWorkspaces(): Promise<Workspace[]>;
  listTasks(workspaceId?: string): Promise<TaskSummary[]>;
  createTask(cwd: string): Promise<TaskSummary>;
  resumeTask(taskId: string): Promise<void>;
  renameTask(taskId: string, title: string): Promise<void>;
  sendMessage(taskId: string, prompt: string): Promise<void>;
  stopTurn(taskId: string): Promise<void>;
  respondToApproval(requestId: string | number, decision: "accept" | "decline"): Promise<void>;
  listWorkspaceFiles(cwd: string): Promise<WorkspaceEntry[]>;
  onSessionEvent(listener: (event: SessionEvent) => void): () => void;
  minimizeWindow(): Promise<void>;
  toggleMaximizeWindow(): Promise<void>;
  closeWindow(): Promise<void>;
}
