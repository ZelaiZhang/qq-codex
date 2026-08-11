import type { ChatMessage, SessionEvent, SessionState } from "./types";

export const initialSession: SessionState = {
  activeTurnId: null,
  connection: "connecting",
  messages: [],
  approvals: {},
  terminal: [],
  fileChanges: [],
  error: null,
};

function completeMessage(message: ChatMessage, turnId: string): ChatMessage {
  return message.turnId === turnId ? { ...message, streaming: false } : message;
}

export function sessionReducer(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case "connection.changed":
      return { ...state, connection: event.connection };
    case "user.message":
      return { ...state, messages: [...state.messages, event.message] };
    case "turn.started":
      return { ...state, activeTurnId: event.turnId, error: null };
    case "assistant.delta": {
      const index = state.messages.findIndex(
        (message) => message.role === "assistant" && message.turnId === event.turnId,
      );
      if (index === -1) {
        return {
          ...state,
          messages: [
            ...state.messages,
            {
              id: `assistant-${event.turnId}`,
              turnId: event.turnId,
              role: "assistant",
              text: event.delta,
              streaming: true,
            },
          ],
        };
      }
      return {
        ...state,
        messages: state.messages.map((message, messageIndex) =>
          messageIndex === index ? { ...message, text: message.text + event.delta } : message,
        ),
      };
    }
    case "turn.completed":
      return {
        ...state,
        activeTurnId: state.activeTurnId === event.turnId ? null : state.activeTurnId,
        messages: state.messages.map((message) => completeMessage(message, event.turnId)),
      };
    case "turn.failed":
      return {
        ...state,
        activeTurnId: state.activeTurnId === event.turnId ? null : state.activeTurnId,
        error: event.message,
        messages: state.messages.map((message) => completeMessage(message, event.turnId)),
      };
    case "approval.requested":
      return {
        ...state,
        approvals: {
          ...state.approvals,
          [event.approval.id]: { ...event.approval, status: "pending" },
        },
      };
    case "approval.resolved": {
      const approval = state.approvals[event.approvalId];
      if (!approval) return state;
      return {
        ...state,
        approvals: {
          ...state.approvals,
          [event.approvalId]: {
            ...approval,
            status: event.decision === "accept" ? "accepted" : "declined",
          },
        },
      };
    }
    case "command.output":
      return { ...state, terminal: [...state.terminal, event.entry] };
    case "file.changed":
      return { ...state, fileChanges: [...state.fileChanges, event.change] };
    case "system.notice":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: `system-${state.messages.length}`,
            role: "system",
            text: event.message,
            streaming: false,
          },
        ],
      };
  }
}
