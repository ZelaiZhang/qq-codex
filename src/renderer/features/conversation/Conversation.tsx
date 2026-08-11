import type { Approval, ChatMessage, TaskSummary } from "../../../domain/types";
import { ApprovalCard } from "./ApprovalCard";
import { Composer } from "./Composer";

interface Props {
  task: TaskSummary | null;
  messages: ChatMessage[];
  approvals: Approval[];
  running: boolean;
  error: string | null;
  onSend(prompt: string): Promise<void>;
  onStop(): Promise<void>;
  onApproval(approval: Approval, decision: "accept" | "decline"): Promise<void> | void;
}

export function Conversation(props: Props) {
  return (
    <main className="conversation" aria-label="Codex 对话">
      <header className="conversation-header">
        <div className="chat-avatar">C</div>
        <div><strong>{props.task?.title ?? "欢迎使用 QQ Codex"}</strong><span>{props.task ? "Codex · 工作区模式" : "选择左侧任务开始办公"}</span></div>
        <div className="header-actions"><button disabled title="首版暂未开放消息搜索">⌕</button><button disabled title="首版暂未开放更多菜单">•••</button></div>
      </header>
      <section className="message-list" aria-live="polite" aria-atomic="false">
        {!props.task && (
          <div className="welcome-card"><span>🐧</span><h2>欢迎回来</h2><p>打开一个本地项目，Codex 就会像老朋友上线一样陪你写代码。</p></div>
        )}
        {props.messages.map((message) => (
          <article className={`message ${message.role}`} key={message.id}>
            <div className="message-avatar">{message.role === "user" ? "我" : message.role === "assistant" ? "C" : "i"}</div>
            <div className="message-body">
              <span className="message-author">{message.role === "user" ? "我" : message.role === "assistant" ? "Codex" : "系统消息"}</span>
              <div className="bubble">{message.text}{message.streaming && <i className="typing-caret" />}</div>
            </div>
          </article>
        ))}
        {props.approvals.map((approval) => (
          <ApprovalCard key={approval.id} approval={approval} onRespond={(decision) => props.onApproval(approval, decision)} />
        ))}
        {props.error && <div className="error-banner">连接提示：{props.error}</div>}
      </section>
      <Composer disabled={!props.task} running={props.running} onSend={props.onSend} onStop={props.onStop} />
    </main>
  );
}
