# Rubber Duck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use cy:subagent-driven-development (recommended) or cy:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static React/WebMCP study companion whose Siko-like graduated help ladder is enforced by live tool registration.

**Architecture:** React Context + reducer owns problem, steps, annotations, telemetry, hint budget, and WebMCP status. A typed `useTool` hook registers tiered definitions against `document.modelContext` or the deprecated `navigator.modelContext` alias, while the sidebar renders the live registry.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Vitest, Testing Library, native WebMCP APIs, localStorage.

## Global Constraints

- No backend; all state is client-side and only the active problem persists to localStorage.
- Tier 0 always exposes read/annotation tools; each token unlocks exactly one stronger tier for the current problem.
- Tool handlers return `{ content: [{ type: "text", text: string }] }`.
- `document.modelContext` is primary; `navigator.modelContext` is fallback; neither present means a setup banner.
- No chat panel, auth, more than five seed problems, or full-solution tool.
- Focused study desk visual direction: warm paper, ink text, amber hint tokens.

## File map

- Create `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/index.css` for the runnable app.
- Create `src/data/problems.json` and `src/data/types.ts` for the five seed problems and domain types.
- Create `src/state/AppContext.tsx`, `src/state/reducer.ts`, `src/state/telemetry.ts`, `src/state/storage.ts` for state boundaries.
- Create `src/tools/definitions.ts`, `src/tools/useTool.ts`, `src/tools/runtime.ts` for descriptions, registration, and handler factories.
- Create `src/components/ProblemCanvas.tsx`, `src/components/StepBlock.tsx`, `src/components/DuckSidebar.tsx`, `src/components/ToolRegistry.tsx`, `src/components/SetupBanner.tsx`, `src/App.tsx` for UI.
- Create `src/__tests__/reducer.test.ts`, `src/__tests__/tools.test.ts`, `src/__tests__/telemetry.test.ts`, `src/__tests__/App.test.tsx`.
- Create `README.md`, `.github/README.md`, `LICENSE` for challenge documentation.

### Task 1: Scaffold the Vite app and test harness

**Files:** create the root config files and `src/main.tsx`, `src/index.css`; test `src/__tests__/App.test.tsx`.

- [ ] Write a failing smoke test that renders `<App />` and expects the heading `Rubber Duck`.
- [ ] Run `pnpm vitest run src/__tests__/App.test.tsx`; expect failure because the app is not scaffolded.
- [ ] Add React/Vite scripts (`dev`, `build`, `test`, `typecheck`) and Tailwind/PostCSS config. Render a minimal `<App />` shell from `src/main.tsx`.
- [ ] Run the smoke test and `pnpm build`; expect both to pass.
- [ ] Commit `chore: scaffold Rubber Duck Vite app`.

### Task 2: Add seed data, reducer, persistence, and telemetry

**Files:** create `src/data/problems.json`, `src/data/types.ts`, `src/state/reducer.ts`, `src/state/telemetry.ts`, `src/state/storage.ts`, `src/state/AppContext.tsx`; test the three state test files.

- [ ] Write tests for five valid problems, step add/edit/delete/reorder, token spending from 3 to 0, annotation actions, and backtracking detection.
- [ ] Run the focused tests; expect failures for missing types/reducer.
- [ ] Implement `Problem`, `RubricMilestone`, `StepBlock`, `Annotation`, `Telemetry`, and `AppState` types. Seed exactly five algorithm problems with milestone arrays.
- [ ] Implement pure reducer actions: `addStep`, `updateStep`, `deleteStep`, `moveStep`, `setFocus`, `spendHint`, `askQuestion`, `placeFlag`, `awardCheck`, `recordKeystroke`.
- [ ] Implement telemetry with `lastKeystrokeAt`, `rewriteCount`, and `isBacktracking` derived from ordered step history; normalize focus and annotations after deletion.
- [ ] Implement JSON localStorage load/save guarded for unavailable or malformed storage.
- [ ] Run focused tests and `pnpm typecheck`; expect pass.
- [ ] Commit `feat: add study state and stuck telemetry`.

### Task 3: Implement WebMCP definitions and gated runtime

**Files:** create `src/tools/definitions.ts`, `src/tools/runtime.ts`, `src/tools/useTool.ts`; test `src/__tests__/tools.test.ts`.

- [ ] Write tests with a fake model context asserting tier-0 registration, one-tool-per-token gating, cleanup, re-registration on dependency changes, invalid-step text results, and exact content return shape.
- [ ] Run the focused tools test; expect failure.
- [ ] Export description constants for every tool. Each description must state purpose, prohibitions, and when to prefer the tool over silence; `ask_question` must require ≤2 sentences and questions only.
- [ ] Implement `getModelContext()` preferring `document.modelContext` and falling back to `navigator.modelContext`; expose a registration status.
- [ ] Implement `createToolHandlers(dispatch, getState)` for reads and mutations. Return `{ content: [{ type: "text", text }] }` for every path.
- [ ] Implement `useTool(toolDef, deps)` with `useEffect`, register/unregister cleanup, dependency re-registration, and a live registry callback.
- [ ] Run tests and typecheck; expect pass.
- [ ] Commit `feat: enforce graduated WebMCP tool ladder`.

### Task 4: Build the focused study desk UI

**Files:** create the five component files and update `src/App.tsx`, `src/index.css`; extend `src/__tests__/App.test.tsx`.

- [ ] Write component tests for seed problem text, editable step blocks, add/delete/reorder controls, three visible tokens, locked tier rows, and token spend adding the analogy tool.
- [ ] Run the UI tests; expect failures.
- [ ] Implement `AppContext` provider wiring, `ProblemCanvas`, `StepBlock`, and focus/keystroke event dispatch.
- [ ] Implement `DuckSidebar`, `ToolRegistry`, and `SetupBanner`. Show tier labels L1 Question, L2 Analogy, L3 Nudge, L4 Next step; animate newly registered tools with a CSS class.
- [ ] Mount tier-0 and unlocked tier tools through `useTool`; expose a `Spend hint` button that dispatches `spendHint` and disables at zero.
- [ ] Style the two-column warm-paper desk with responsive stacking sufficient for usability (no mobile polish scope), clear status colors, and inline annotations.
- [ ] Run UI tests, `pnpm build`, and `pnpm typecheck`; expect pass.
- [ ] Commit `feat: build Rubber Duck study desk`.

### Task 5: Add public-repo documentation and MIT license

**Files:** update `README.md`; create `.github/README.md`, `LICENSE`, and screenshot/GIF placeholder files or documented paths.

- [ ] Write a documentation check that asserts README mentions WebMCP, Chrome flag, ChatGPT in-app browser, `pnpm dev`, tool tiers, and judge steps.
- [ ] Add the thesis, “Why WebMCP is the point, not the plumbing,” tool-surface table, setup, enablement, testing instructions, screenshot/GIF placeholders, and limitations.
- [ ] Add the full MIT license text and a concise `.github/README.md` challenge summary.
- [ ] Run the documentation check and `git diff --check`; expect pass.
- [ ] Commit `docs: prepare WebMCP Challenge repo materials`.

### Task 6: Verify the complete judge path

**Files:** no new production files; create `tests/e2e/rubber-duck.spec.ts`.

- [ ] Run `pnpm test`, `pnpm typecheck`, and `pnpm build`.
- [ ] Start `pnpm dev`, open the app in a browser without WebMCP, and verify the setup banner plus editable seed problem.
- [ ] In a WebMCP-capable browser, verify tier-0 tools in DevTools, spend a token, verify `give_analogy` appears, and call each registered tool to confirm result shape.
- [ ] Capture one desktop screenshot and one GIF placeholder reference for README.
- [ ] Run `git diff --check` and record the verification commands in the final handoff.
- [ ] Commit `test: verify Rubber Duck judge path`.
