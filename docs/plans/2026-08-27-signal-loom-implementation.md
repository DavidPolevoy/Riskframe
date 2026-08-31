# Signal Loom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use cy:subagent-driven-development (recommended) or cy:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Signal Loom, a WebMCP-native visual reasoning debugger for decisions.

**Architecture:** Keep the existing Vite + React + reducer + WebMCP hook architecture. Replace problem/step state with decision graph state, render an auto-laid graph and parking lot, and expose WebMCP tools that create proposals and visible analysis markers.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, localStorage, WebMCP `modelContext`.

## Global Constraints

- Static client-only app; no backend or auth.
- Auto-layout only; drag-to-pan and scroll-wheel zoom the canvas, but no manual card dragging in v1.
- ChatGPT mutations create proposals or markers; user browser actions commit accepted/parked/rejected graph state.
- Preserve `{ content: [{ type: "text", text }] }` tool results.
- Use Signal Loom as the package, page title, documentation, and user-facing project identity.

---

### Task 1: Decision Graph State

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/state/reducer.ts`
- Modify: `src/state/storage.ts`
- Test: `src/__tests__/reducer.test.ts`

**Interfaces:**
- Produces: `createInitialState()` with `decision`, `lens`, `cards`, `links`, `proposals`, `parkingLot`, `conflicts`, `fragilePaths`, and `summary`.
- Produces reducer actions: `startDecision`, `updateDecision`, `setLens`, `mapDecision`, `acceptProposal`, `parkProposal`, `rejectProposal`, `promoteParked`, `proposeCard`, `proposeLink`, `flagConflict`, `flagFragilePath`, `scoreConfidence`, `writeSummary`, `resetSession`.

- [ ] Write failing reducer tests for decision mapping, proposal accept/park/reject, parked promotion, and conflict flags.
- [ ] Run the reducer tests and verify they fail on missing graph behavior.
- [ ] Replace study state with decision graph state and reducer transitions.
- [ ] Run reducer tests and verify they pass.

### Task 2: WebMCP Tool Surface

**Files:**
- Modify: `src/tools/definitions.ts`
- Modify: `src/tools/runtime.ts`
- Test: `src/__tests__/tools.test.ts`

**Interfaces:**
- Consumes: graph state and reducer actions from Task 1.
- Produces tool names listed in the design spec.

- [ ] Write failing tool tests for graph reads, proposal creation, invalid link validation, and content envelope shape.
- [ ] Run tool tests and verify they fail on the previous study-tool surface.
- [ ] Replace tool definitions and handlers with Signal Loom graph tools.
- [ ] Run tool tests and verify they pass.

### Task 3: App Shell And Visualization

**Files:**
- Modify: `src/App.tsx`
- Replace: `src/components/ReasoningCanvas.tsx`
- Replace: `src/components/AgentSidebar.tsx`
- Modify: `src/index.css`
- Test: `src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: graph state and WebMCP registered tool names.
- Produces: auto-laid reasoning canvas, ghost proposals, parking lot, and agent surface.

- [ ] Write failing app tests for Signal Loom heading, absence of manual decision intake controls, WebMCP-started ghost proposals, parking lot, and visible tool surface.
- [ ] Run app tests and verify they fail on the old study UI.
- [ ] Implement the Signal Loom app shell and visualization.
- [ ] Run app tests and verify they pass.

### Task 4: Rename And Documentation

**Files:**
- Modify: `package.json`
- Modify: `index.html`
- Modify: `README.md`
- Test: existing test suite and build.

- [ ] Rename package/title/docs to Signal Loom.
- [ ] Run typecheck, tests, build, and diff check.
