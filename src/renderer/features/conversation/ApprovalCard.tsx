import type { Approval } from "../../../domain/types";
import { useState } from "react";

interface Props {
  approval: Approval;
  onRespond(decision: "accept" | "decline"): Promise<void> | void;
}

export function ApprovalCard({ approval, onRespond }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const respond = async (decision: "accept" | "decline") => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onRespond(decision);
    } catch {
      setSubmitting(false);
    }
  };
  return (
    <article className="approval-card">
      <div className="approval-icon">!</div>
      <div>
        <strong>{approval.title}</strong>
        <pre>{approval.detail}</pre>
        {approval.status === "pending" ? (
          <div className="approval-actions">
            <button disabled={submitting} className="approve" onClick={() => void respond("accept")}>允许</button>
            <button disabled={submitting} onClick={() => void respond("decline")}>拒绝</button>
          </div>
        ) : <span className={`decision ${approval.status}`}>{approval.status === "accepted" ? "已允许" : "已拒绝"}</span>}
      </div>
    </article>
  );
}
