import { useState, type KeyboardEvent } from "react";

interface Props {
  disabled: boolean;
  running: boolean;
  onSend(prompt: string): Promise<void>;
  onStop(): Promise<void>;
}

export function Composer({ disabled, running, onSend, onStop }: Props) {
  const [value, setValue] = useState("");
  const submit = async () => {
    const prompt = value.trim();
    if (!prompt || disabled) return;
    setValue("");
    await onSend(prompt);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };
  return (
    <section className="composer">
      <div className="composer-tools" aria-label="消息工具栏">
        <button disabled title="首版暂未开放添加文件">📎</button><button disabled title="首版暂未开放提及文件">@</button><button disabled title="首版暂未开放截图">▣</button>
        <span>Enter 发送 · Shift+Enter 换行</span>
      </div>
      <textarea
        aria-label="给 Codex 发消息"
        placeholder={disabled ? "先选择或新建一个任务" : "跟 Codex 说点什么…"}
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="composer-actions">
        {running && <button className="stop-button" onClick={() => void onStop()}>停止</button>}
        <button className="send-button" disabled={disabled || !value.trim()} onClick={() => void submit()}>发送</button>
      </div>
    </section>
  );
}
