import type { TaskSummary, Workspace } from "../../../domain/types";

interface Props {
  workspaces: Workspace[];
  tasks: TaskSummary[];
  selectedWorkspaceId: string | null;
  selectedTaskId: string | null;
  onSelectWorkspace(workspace: Workspace): void;
  onSelectTask(task: TaskSummary): void;
  onCreateTask(): void;
  onOpenProject(): void;
}

export function BuddyList(props: Props) {
  return (
    <nav className="buddy-list" aria-label="项目与任务">
      <section className="profile-card">
        <div className="penguin-avatar" aria-hidden="true">🐧</div>
        <div className="profile-copy">
          <strong>QQ Codex</strong>
          <span><i className="online-dot" /> 在线办公中</span>
        </div>
      </section>
      <label className="buddy-search">
        <span aria-hidden="true">⌕</span>
        <input aria-label="搜索项目与任务" placeholder="搜索项目、任务" />
      </label>

      <div className="buddy-scroll">
        <section className="buddy-group">
          <header><span>▾ 本地项目</span><button onClick={props.onOpenProject} aria-label="打开项目">＋</button></header>
          {props.workspaces.length === 0 ? (
            <button className="empty-buddy" onClick={props.onOpenProject}>打开第一个项目</button>
          ) : props.workspaces.map((workspace) => (
            <button
              className={workspace.id === props.selectedWorkspaceId ? "buddy-row selected" : "buddy-row"}
              key={workspace.id}
              onClick={() => props.onSelectWorkspace(workspace)}
            >
              <span className="buddy-icon folder">📁</span>
              <span className="buddy-name"><strong>{workspace.name}</strong><small>{workspace.path}</small></span>
            </button>
          ))}
        </section>

        <section className="buddy-group">
          <header><span>▾ 最近任务</span><button onClick={props.onCreateTask} aria-label="新建任务">＋</button></header>
          {props.tasks.map((task) => (
            <button
              className={task.id === props.selectedTaskId ? "buddy-row selected" : "buddy-row"}
              key={task.id}
              onClick={() => props.onSelectTask(task)}
            >
              <span className="buddy-icon status-avatar">C</span>
              <span className="buddy-name"><strong>{task.title}</strong><small>Codex 会话</small></span>
              <i className="presence-dot" aria-label="可用" />
            </button>
          ))}
        </section>
      </div>

      <footer className="buddy-footer">
        <button title="主菜单">☰</button><button title="消息">✉</button><button title="设置">⚙</button>
      </footer>
    </nav>
  );
}
