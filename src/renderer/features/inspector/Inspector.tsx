import { useState } from "react";
import type { FileChange, TerminalEntry, WorkspaceEntry } from "../../../domain/types";

type Tab = "files" | "diff" | "terminal";

interface Props {
  files: WorkspaceEntry[];
  changes: FileChange[];
  terminal: TerminalEntry[];
}

export function Inspector({ files, changes, terminal }: Props) {
  const [tab, setTab] = useState<Tab>("files");
  return (
    <aside className="inspector" aria-label="工作区检查器">
      <div className="inspector-tabs" role="tablist" aria-label="工作区视图">
        <button role="tab" aria-selected={tab === "files"} onClick={() => setTab("files")}>文件</button>
        <button role="tab" aria-selected={tab === "diff"} onClick={() => setTab("diff")}>修改 <b>{changes.length}</b></button>
        <button role="tab" aria-selected={tab === "terminal"} onClick={() => setTab("terminal")}>终端</button>
      </div>
      <div className="inspector-content">
        {tab === "files" && <div className="file-tree">{files.length ? files.map((entry) => (
          <div className={`file-entry ${entry.kind}`} key={entry.path}><span>{entry.kind === "directory" ? "▾ 📁" : "  ◻"}</span>{entry.path}</div>
        )) : <div className="panel-empty">选择项目后显示文件</div>}</div>}
        {tab === "diff" && <div className="diff-view">{changes.length ? changes.map((change) => (
          <section key={change.id}><header>{change.path}</header><pre>{change.diff}</pre></section>
        )) : <div className="panel-empty">当前还没有文件修改</div>}</div>}
        {tab === "terminal" && <div className="terminal-view">{terminal.length ? terminal.map((entry, index) => (
          <div className={entry.stream} key={`${entry.id}-${index}`}>{entry.text}</div>
        )) : <div className="terminal-placeholder">Microsoft Windows [QQ Codex]<br />等待 Codex 运行命令…</div>}</div>}
      </div>
    </aside>
  );
}
