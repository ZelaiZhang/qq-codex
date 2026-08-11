import type { DesktopApi } from "../domain/types";
import { BuddyList } from "./features/buddy-list/BuddyList";
import { Conversation } from "./features/conversation/Conversation";
import { Inspector } from "./features/inspector/Inspector";
import { TitleBar } from "./features/title-bar/TitleBar";
import { useCodexClient } from "./state/useCodexClient";
import { useThemePreference } from "./theme/useThemePreference";

const unavailable = async () => { throw new Error("请从 QQ Codex 桌面应用启动"); };
const browserFallbackApi: DesktopApi = {
  chooseWorkspace: async () => null,
  listWorkspaces: async () => [],
  listTasks: async () => [],
  createTask: unavailable,
  resumeTask: unavailable,
  renameTask: unavailable,
  sendMessage: unavailable,
  stopTurn: unavailable,
  respondToApproval: unavailable,
  listWorkspaceFiles: async () => [],
  onSessionEvent: () => () => undefined,
  minimizeWindow: async () => undefined,
  toggleMaximizeWindow: async () => undefined,
  closeWindow: async () => undefined,
};

export function App({ api = window.qqCodex ?? browserFallbackApi }: { api?: DesktopApi }) {
  const client = useCodexClient(api);
  const [theme, setTheme] = useThemePreference();
  const approvals = Object.values(client.session.approvals);

  return (
    <div className="app-frame" data-theme={theme}>
      <TitleBar api={api} theme={theme} onThemeChange={setTheme} />
      <div className="app-shell">
        <BuddyList
          theme={theme}
          workspaces={client.workspaces}
          tasks={client.tasks}
          selectedWorkspaceId={client.selectedWorkspace?.id ?? null}
          selectedTaskId={client.selectedTask?.id ?? null}
          onSelectWorkspace={(workspace) => void client.selectWorkspace(workspace)}
          onSelectTask={(task) => void client.selectTask(task)}
          onCreateTask={() => void client.createTask()}
          onOpenProject={() => void client.createTask()}
          onRenameTask={client.renameTask}
        />
        <Conversation
          task={client.selectedTask}
          messages={client.session.messages}
          approvals={approvals}
          running={Boolean(client.session.activeTurnId)}
          error={client.session.error}
          onSend={client.sendMessage}
          onStop={client.stopTurn}
          onApproval={(approval, decision) =>
            client.respondToApproval(approval.id, approval.requestId, decision)}
        />
        <Inspector
          files={client.files}
          changes={client.session.fileChanges}
          terminal={client.session.terminal}
        />
      </div>
      <footer className="status-bar">
        <span className={`connection ${client.session.connection}`}><i />{
          client.session.connection === "online" ? "Codex 在线" :
          client.session.connection === "connecting" ? "正在连接 Codex" :
          client.session.connection === "error" ? "连接异常" : "离线"
        }</span>
        <span>{client.selectedWorkspace?.path ?? "尚未打开项目"}</span>
        <span className="status-hint">安全模式 · 修改需审批</span>
      </footer>
    </div>
  );
}
