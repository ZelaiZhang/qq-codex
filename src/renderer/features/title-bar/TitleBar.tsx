import type { DesktopApi } from "../../../domain/types";

export function TitleBar({ api }: { api: DesktopApi }) {
  return (
    <header className="title-bar">
      <div className="brand-mark">🐧</div><strong>QQ Codex</strong><span className="title-task">古早风智能办公客户端</span>
      <div className="window-controls">
        <button aria-label="最小化" onClick={() => void api.minimizeWindow()}>－</button>
        <button aria-label="最大化" onClick={() => void api.toggleMaximizeWindow()}>□</button>
        <button className="close" aria-label="关闭" onClick={() => void api.closeWindow()}>×</button>
      </div>
    </header>
  );
}
