# QQ Codex Dual Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent runtime switch between the existing QQ 2009 theme and a complete modern WeChat-inspired theme.

**Architecture:** Keep the current React workbench mounted while a small theme preference module controls `data-theme` on the document and app shell. Preserve the QQ stylesheet as the baseline and load a dedicated WeChat override stylesheet after it.

**Tech Stack:** React 19, TypeScript, CSS custom properties and selectors, Vitest, Testing Library, Playwright Electron.

---

### Task 1: Theme preference domain

**Files:**
- Create: `src/renderer/theme/themePreference.ts`
- Create: `tests/unit/themePreference.test.ts`

- [ ] Write failing tests for default, valid, invalid and saved preferences.
- [ ] Run `npm test -- --run tests/unit/themePreference.test.ts` and confirm the missing-module failure.
- [ ] Implement the `ThemeName`, `readThemePreference` and `writeThemePreference` API with storage failure fallbacks.
- [ ] Run the focused test and confirm it passes.

### Task 2: Runtime theme switch

**Files:**
- Create: `src/renderer/theme/useThemePreference.ts`
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/features/title-bar/TitleBar.tsx`
- Modify: `tests/component/App.test.tsx`

- [ ] Write a failing component test that switches to WeChat, updates `data-theme`, updates the title bar and persists the choice.
- [ ] Run the focused component test and confirm the missing-control failure.
- [ ] Implement the hook, app integration and accessible segmented switch.
- [ ] Run unit and component tests and confirm they pass.

### Task 3: Modern WeChat visual system

**Files:**
- Create: `src/renderer/styles/wechat.css`
- Modify: `src/renderer/styles/index.css`

- [ ] Add a component assertion for the stable `data-theme` contract before styling.
- [ ] Define WeChat tokens and override every primary surface: frame, title bar, sidebar, rows, conversation, messages, composer, inspector, terminal and status.
- [ ] Add tactile, focus and reduced-motion states without decorative animation.
- [ ] Run component tests and TypeScript checking.

### Task 4: Packaged persistence and documentation

**Files:**
- Modify: `tests/e2e/app.spec.ts`
- Modify: `README.md`
- Modify: `package.json`

- [ ] Extend E2E to switch to WeChat and verify the selection after reload.
- [ ] Update product description, feature list and version to `0.2.0`.
- [ ] Run typecheck, all tests, production audit, build and packaging.
- [ ] Capture and visually inspect both theme screenshots.
- [ ] Commit, merge to `main`, push `origin/main`, and launch the rebuilt client.

## Plan self-review

- Every design requirement maps to a task.
- Theme names are consistently `qq` and `wechat` across storage, DOM and tests.
- No placeholders or independent subsystem changes are included.
