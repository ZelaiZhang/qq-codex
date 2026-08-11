import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApprovalCard } from "../../src/renderer/features/conversation/ApprovalCard";

describe("ApprovalCard", () => {
  it("prevents a decision from being submitted twice", async () => {
    const user = userEvent.setup();
    const onRespond = vi.fn();
    render(<ApprovalCard approval={{
      id: "approval-1",
      requestId: 7,
      kind: "command",
      title: "运行命令",
      detail: "npm test",
      status: "pending",
    }} onRespond={onRespond} />);

    await user.dblClick(screen.getByRole("button", { name: "允许" }));

    expect(onRespond).toHaveBeenCalledTimes(1);
  });
});
