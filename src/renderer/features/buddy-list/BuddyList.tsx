import type { TaskSummary, Workspace } from "../../../domain/types";
import { useState, type KeyboardEvent } from "react";

interface Props {
  workspaces: Workspace[];
  tasks: TaskSummary[];
  selectedWorkspaceId: string | null;
  selectedTaskId: string | null;
  onSelectWorkspace(workspace: Workspace): void;
  onSelectTask(task: TaskSummary): void;
  onCreateTask(): void;
  onOpenProject(): void;
  onRenameTask(taskId: string, title: string): Promise<void> | void;
}

export function BuddyList(props: Props) {
  const [query, setQuery] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
  const visibleWorkspaces = props.workspaces.filter((workspace) =>
    !normalizedQuery || `${workspace.name} ${workspace.path}`.toLocaleLowerCase("zh-CN").includes(normalizedQuery));
  const visibleTasks = props.tasks.filter((task) =>
    !normalizedQuery || task.title.toLocaleLowerCase("zh-CN").includes(normalizedQuery));
  const beginRename = (task: TaskSummary) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };
  const finishRename = async () => {
    const title = editingTitle.trim();
    if (!editingTaskId || !title) return;
    await props.onRenameTask(editingTaskId, title);
    setEditingTaskId(null);
  };
  const renameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") void finishRename();
    if (event.key === "Escape") setEditingTaskId(null);
  };
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
        <input
          aria-label="搜索项目与任务"
          placeholder="搜索项目、任务"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className="buddy-scroll">
        <section className="buddy-group">
          <header><span>▾ 本地项目</span><button onClick={props.onOpenProject} aria-label="打开项目">＋</button></header>
          {props.workspaces.length === 0 ? (
            <button className="empty-buddy" onClick={props.onOpenProject}>打开第一个项目</button>
          ) : visibleWorkspaces.map((workspace) => (
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
          {visibleTasks.map((task) => editingTaskId === task.id ? (
            <div className="buddy-row selected" key={task.id}>
              <span className="buddy-icon status-avatar">C</span>
              <span className="buddy-name">
                <input
                  autoFocus
                  aria-label="任务名称"
                  value={editingTitle}
                  onChange={(event) => setEditingTitle(event.target.value)}
                  onKeyDown={renameKeyDown}
                  onBlur={() => void finishRename()}
                />
                <small>Enter 保存 · Esc 取消</small>
              </span>
            </div>
          ) : (
            <button
              className={task.id === props.selectedTaskId ? "buddy-row selected" : "buddy-row"}
              key={task.id}
              onClick={() => props.onSelectTask(task)}
              onDoubleClick={() => beginRename(task)}
            >
              <span className="buddy-icon status-avatar">C</span>
              <span className="buddy-name"><strong>{task.title}</strong><small>Codex 会话</small></span>
              <i className="presence-dot" aria-label="可用" />
            </button>
          ))}
        </section>
      </div>

      <footer className="buddy-footer">
        <button disabled title="首版暂未开放主菜单">☰</button><button disabled title="首版暂未开放消息中心">✉</button><button disabled title="首版暂未开放设置">⚙</button>
      </footer>
    </nav>
  );
}
