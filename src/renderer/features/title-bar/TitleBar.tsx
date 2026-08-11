import type { DesktopApi } from "../../../domain/types";
import type { ThemeName } from "../../theme/themePreference";

export function TitleBar({
  api,
  theme,
  onThemeChange,
}: {
  api: DesktopApi;
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
}) {
  const isWeChat = theme === "wechat";

  return (
    <header className="title-bar">
      <div className="brand-mark" aria-hidden="true">{isWeChat ? "💬" : "🐧"}</div>
      <strong>{isWeChat ? "微信 Codex" : "QQ Codex"}</strong>
      <span className="title-task">{isWeChat ? "现代简洁智能办公客户端" : "古早风智能办公客户端"}</span>
      <div className="theme-switch" role="group" aria-label="界面主题">
        <button
          type="button"
          aria-label="QQ主题"
          aria-pressed={theme === "qq"}
          onClick={() => onThemeChange("qq")}
        >QQ</button>
        <button
          type="button"
          aria-label="微信主题"
          aria-pressed={isWeChat}
          onClick={() => onThemeChange("wechat")}
        >微信</button>
      </div>
      <div className="window-controls">
        <button aria-label="最小化" onClick={() => void api.minimizeWindow()}>－</button>
        <button aria-label="最大化" onClick={() => void api.toggleMaximizeWindow()}>□</button>
        <button className="close" aria-label="关闭" onClick={() => void api.closeWindow()}>×</button>
      </div>
    </header>
  );
}
