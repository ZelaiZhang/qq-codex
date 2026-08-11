# QQ Codex MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows desktop Codex client with a QQ 2009-inspired interface and a real local Codex task workflow.

**Architecture:** Electron owns the window, secure IPC, local workspace access, persistence, and a bundled Codex App Server process. React renders a three-pane UI and consumes a small domain API exposed by preload. A typed adapter translates App Server JSON-RPC events into application events so the UI never depends directly on protocol internals.

**Tech Stack:** Electron, React 19, TypeScript, Vite, `@openai/codex`, Zustand, Zod, Vitest, Testing Library, Playwright, npm

---

## File map

- `package.json`: scripts and dependencies.
- `electron/main.ts`: Electron lifecycle and secure window creation.
- `electron/preload.ts`: whitelisted renderer API.
- `electron/ipc.ts`: IPC registration and payload validation.
- `src/domain/types.ts`: stable application-domain types.
- `src/domain/sessionReducer.ts`: deterministic event-to-state reducer.
- `src/main/codex/CodexGateway.ts`: gateway interface.
- `src/main/codex/AppServerTransport.ts`: newline-delimited JSON-RPC process transport.
- `src/main/codex/AppServerCodexGateway.ts`: real Codex App Server implementation.
- `src/main/codex/MockCodexGateway.ts`: deterministic integration-test gateway.
- `src/main/workspaces/WorkspaceStore.ts`: recent workspaces and task references.
- `src/renderer/App.tsx`: application shell composition.
- `src/renderer/features/buddy-list/*`: projects and task list.
- `src/renderer/features/conversation/*`: messages, approvals, composer.
- `src/renderer/features/inspector/*`: files, Diff, and terminal panels.
- `src/renderer/styles/*`: QQ 2009 tokens, layout, components, accessibility.
- `tests/unit/*`: reducer, validation, and store tests.
- `tests/component/*`: React component tests.
- `tests/e2e/*`: packaged desktop smoke path.

### Task 1: Project scaffold and quality gates

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `src/renderer/main.tsx`
- Create: `src/renderer/test/setup.ts`

- [ ] **Step 1: Write the package scripts and dependency manifest**

Use scripts `dev`, `build`, `test`, `test:watch`, `typecheck`, and `lint`. Add Electron, React, the Codex CLI package, Zustand and Zod as runtime dependencies; add Vite, TypeScript, Vitest, jsdom, Testing Library, ESLint and electron-builder as development dependencies.

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and npm exits with code 0.

- [ ] **Step 3: Add the minimal renderer entry**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>,
);
```

- [ ] **Step 4: Verify the empty project**

Run: `npm run typecheck && npm test -- --run`

Expected: TypeScript succeeds and Vitest reports no failing tests.

- [ ] **Step 5: Commit**

Run: `git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts index.html src && git commit -m "build: scaffold QQ Codex desktop client"`

### Task 2: Domain model and reducer

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/sessionReducer.ts`
- Create: `tests/unit/sessionReducer.test.ts`

- [ ] **Step 1: Write failing reducer tests**

```ts
it("streams assistant text into the active message", () => {
  const started = sessionReducer(initialSession, { type: "turn.started", turnId: "t1" });
  const next = sessionReducer(started, { type: "assistant.delta", turnId: "t1", delta: "你好" });
  expect(next.messages.at(-1)).toMatchObject({ role: "assistant", text: "你好", streaming: true });
});

it("creates a pending approval", () => {
  const next = sessionReducer(initialSession, {
    type: "approval.requested", approval: { id: "a1", kind: "command", title: "npm test", detail: "npm test" },
  });
  expect(next.approvals.a1.status).toBe("pending");
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- --run tests/unit/sessionReducer.test.ts`

Expected: FAIL because the reducer modules do not exist.

- [ ] **Step 3: Implement explicit domain types and a pure reducer**

Define `Workspace`, `TaskSummary`, `ChatMessage`, `Approval`, `TerminalEntry`, `FileChange`, `SessionState`, and a discriminated `SessionEvent`. Implement only deterministic state transitions; perform no I/O in the reducer.

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test -- --run tests/unit/sessionReducer.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/domain tests/unit/sessionReducer.test.ts && git commit -m "feat: add Codex session domain model"`

### Task 3: Codex App Server transport and event normalization

**Files:**
- Create: `src/main/codex/CodexGateway.ts`
- Create: `src/main/codex/AppServerTransport.ts`
- Create: `src/main/codex/AppServerCodexGateway.ts`
- Create: `src/main/codex/normalizeCodexEvent.ts`
- Create: `src/main/codex/MockCodexGateway.ts`
- Create: `tests/unit/normalizeCodexEvent.test.ts`

- [ ] **Step 1: Generate and inspect App Server declarations**

Run the package-local Codex executable with `app-server generate-ts --out src/main/codex/generated --experimental`, using the exact executable path exported by `@openai/codex`.

Expected: TypeScript declarations for initialization, threads, turns, approvals, and notifications are created. Use these declarations as the protocol source of truth.

- [ ] **Step 2: Write failing normalization tests**

Cover assistant text deltas, command output, file changes, turn completion, errors, and unknown events. Unknown events must normalize to `system.notice` rather than crash.

- [ ] **Step 3: Define the gateway contract**

```ts
export interface CodexGateway {
  startThread(input: { cwd: string }): Promise<{ threadId: string }>;
  resumeThread(input: { cwd: string; threadId: string }): Promise<void>;
  run(input: { threadId: string; prompt: string }): Promise<void>;
  stop(threadId: string): Promise<void>;
  respondToApproval(input: { requestId: string | number; decision: "accept" | "decline" }): Promise<void>;
  onEvent(listener: (event: SessionEvent) => void): () => void;
  dispose(): Promise<void>;
}
```

- [ ] **Step 4: Implement the App Server transport and gateway**

Spawn `codex app-server --listen stdio://`, send newline-delimited JSON-RPC requests, correlate numeric request IDs, and parse one JSON object per stdout line. Send `initialize` followed by `initialized`, start threads with the selected working directory and workspace-write sandbox, start turns with the user prompt, convert server notifications into application events, and reply to approval requests with the original request ID. Never expose protocol objects to React.

- [ ] **Step 5: Verify gateway tests**

Run: `npm test -- --run tests/unit/normalizeCodexEvent.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

Run: `git add src/main/codex tests/unit/normalizeCodexEvent.test.ts && git commit -m "feat: integrate Codex SDK gateway"`

### Task 4: Secure Electron shell, persistence, and IPC

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `electron/ipc.ts`
- Create: `src/main/workspaces/WorkspaceStore.ts`
- Create: `src/shared/desktopApi.ts`
- Create: `tests/unit/WorkspaceStore.test.ts`
- Create: `tests/unit/ipcSchemas.test.ts`

- [ ] **Step 1: Write failing store and validation tests**

Test recent-workspace deduplication, invalid directory rejection, empty prompt rejection, and rejection of approval identifiers containing control characters.

- [ ] **Step 2: Implement the store and Zod IPC schemas**

Persist JSON under Electron `userData`. Store only recent paths, task IDs, labels, timestamps, window bounds, and UI preferences.

- [ ] **Step 3: Implement the preload contract**

```ts
export interface DesktopApi {
  chooseWorkspace(): Promise<string | null>;
  listWorkspaces(): Promise<Workspace[]>;
  createTask(cwd: string): Promise<TaskSummary>;
  resumeTask(taskId: string): Promise<void>;
  renameTask(taskId: string, title: string): Promise<void>;
  sendMessage(taskId: string, prompt: string): Promise<void>;
  stopTurn(taskId: string): Promise<void>;
  respondToApproval(requestId: string | number, decision: "accept" | "decline"): Promise<void>;
  listWorkspaceFiles(cwd: string): Promise<Array<{ path: string; kind: "file" | "directory" }>>;
  onSessionEvent(listener: (event: SessionEvent) => void): () => void;
}
```

Expose it with `contextBridge`; set `contextIsolation: true`, `sandbox: true`, and `nodeIntegration: false`.

- [ ] **Step 4: Run verification**

Run: `npm test -- --run tests/unit/WorkspaceStore.test.ts tests/unit/ipcSchemas.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add electron src/main/workspaces src/shared tests/unit && git commit -m "feat: add secure desktop bridge"`

### Task 5: QQ 2009 application shell

**Files:**
- Create: `src/renderer/App.tsx`
- Create: `src/renderer/state/useAppStore.ts`
- Create: `src/renderer/features/buddy-list/BuddyList.tsx`
- Create: `src/renderer/features/conversation/Conversation.tsx`
- Create: `src/renderer/features/conversation/Composer.tsx`
- Create: `src/renderer/features/inspector/Inspector.tsx`
- Create: `src/renderer/styles/index.css`
- Create: `src/renderer/styles/tokens.css`
- Create: `src/renderer/styles/shell.css`
- Create: `tests/component/App.test.tsx`

- [ ] **Step 1: Write the failing shell test**

```tsx
render(<App />);
expect(screen.getByRole("navigation", { name: "项目与任务" })).toBeVisible();
expect(screen.getByRole("main", { name: "Codex 对话" })).toBeVisible();
expect(screen.getByRole("complementary", { name: "工作区检查器" })).toBeVisible();
```

- [ ] **Step 2: Implement the accessible three-pane shell**

Use semantic landmarks and CSS grid columns `248px minmax(420px, 1fr) 380px`. Under 1100 pixels, render the inspector as a right-side overlay; under 760 pixels, collapse the buddy list behind a toolbar button.

- [ ] **Step 3: Apply QQ 2009 tokens**

Use a blue gradient title bar, pale-blue panels, crisp one-pixel borders, 6-pixel radii, compact spacing, a 48-pixel profile avatar, classic high-light buttons, and a single green online indicator. Keep code and Diff surfaces neutral for readability. Add visible `:focus-visible` outlines and disable nonessential transitions under `prefers-reduced-motion: reduce`.

- [ ] **Step 4: Verify the shell**

Run: `npm test -- --run tests/component/App.test.tsx && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/renderer tests/component/App.test.tsx && git commit -m "feat: build QQ 2009 desktop shell"`

### Task 6: Conversation, approvals, Diff, and terminal views

**Files:**
- Create: `src/renderer/features/conversation/MessageList.tsx`
- Create: `src/renderer/features/conversation/ApprovalCard.tsx`
- Create: `src/renderer/features/inspector/FileTree.tsx`
- Create: `src/renderer/features/inspector/DiffViewer.tsx`
- Create: `src/renderer/features/inspector/TerminalView.tsx`
- Create: `tests/component/Conversation.test.tsx`
- Create: `tests/component/ApprovalCard.test.tsx`

- [ ] **Step 1: Write failing interaction tests**

Verify that sending trims the prompt, streaming text updates one assistant message, Stop aborts the active turn, task renaming persists, approval buttons cannot be submitted twice, and terminal output preserves ordering.

- [ ] **Step 2: Implement conversation states**

Render user and assistant messages, tool activity rows, connection errors, empty state, current streaming indicator, and retry action. Use an `aria-live="polite"` region without announcing every token.

- [ ] **Step 3: Implement inspector states**

Render a path-safe file tree, split or unified Diff depending on width, and a read-only terminal event log in the MVP. Approval actions remain in the conversation timeline so context is visible.

- [ ] **Step 4: Run component tests**

Run: `npm test -- --run tests/component/Conversation.test.tsx tests/component/ApprovalCard.test.tsx && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/renderer/features tests/component && git commit -m "feat: add Codex conversation workbench"`

### Task 7: Real workflow, compatibility states, and desktop smoke test

**Files:**
- Create: `src/renderer/features/status/ConnectionStatus.tsx`
- Create: `tests/e2e/app.spec.ts`
- Create: `playwright.config.ts`
- Modify: `electron/ipc.ts`
- Modify: `src/renderer/App.tsx`
- Modify: `package.json`

- [ ] **Step 1: Add a deterministic mock mode**

When `QQ_CODEX_GATEWAY=mock`, inject `MockCodexGateway`. The mock must emit the same domain events as the real gateway and support one streamed message, one command event, one file change, and one recoverable error.

- [ ] **Step 2: Write the desktop smoke test**

Launch Electron in mock mode, select the bundled fixture workspace, create a task, send “检查项目”, wait for the streamed reply, switch to the Diff tab, and assert that reconnecting restores the task label.

- [ ] **Step 3: Implement compatibility reporting**

Detect missing SDK binary, authentication failure, unsupported event shapes, invalid workspace, and unexpected process exit. Show the error category, summary, retry action, and a copy-details button.

- [ ] **Step 4: Run the full gate**

Run: `npm run typecheck && npm test -- --run && npm run build && npm run test:e2e`

Expected: all commands exit 0.

- [ ] **Step 5: Perform a real local Codex probe**

Run the development app without `QQ_CODEX_GATEWAY=mock`, select this repository, create a thread, and ask it to list the project files without modifying them. Record whether authentication and streaming succeed. If the packaged WindowsApps binary is inaccessible, verify that the package-local `@openai/codex` binary is selected and surface the actionable installation error if it is not.

- [ ] **Step 6: Commit**

Run: `git add . && git commit -m "test: verify QQ Codex desktop workflow"`

### Task 8: Packaging and handoff

**Files:**
- Create: `README.md`
- Create: `assets/icon.png`
- Modify: `package.json`

- [ ] **Step 1: Document setup and limits**

Document Node requirements, `npm install`, `npm run dev`, authentication expectations, the real-vs-mock gateway distinction, security model, current feature coverage, and known first-party feature gaps.

- [ ] **Step 2: Configure Windows packaging**

Configure electron-builder for an unpacked Windows directory and NSIS installer. Include the renderer build, Electron main files, production dependencies, and icon.

- [ ] **Step 3: Build the distributable**

Run: `npm run package`

Expected: an unpacked Windows application and installer appear under `release/`.

- [ ] **Step 4: Final verification**

Run: `npm run typecheck && npm test -- --run && npm run build`

Expected: all commands exit 0 and `git status --short` contains no uncommitted source changes.

- [ ] **Step 5: Commit**

Run: `git add README.md assets package.json package-lock.json && git commit -m "docs: package QQ Codex MVP"`
