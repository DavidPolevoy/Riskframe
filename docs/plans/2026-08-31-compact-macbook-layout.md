# Compact MacBook Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use cy:subagent-driven-development (recommended) or cy:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Riskframe comfortable in a narrow browser beside ChatGPT on a 14-inch MacBook.

**Architecture:** Keep the cockpit interaction model and graph state unchanged. Add responsive CSS and small DOM affordances so the app collapses from full desktop to stacked split-screen mode around `1180px`, then dense mode around `760px`.

**Tech Stack:** React, TypeScript, CSS media queries, Vitest, Testing Library, Vite.

## Global Constraints

- Preserve WebMCP tools and graph semantics.
- Preserve Accept, Park, Reject actions.
- Preserve no-overlap card layout using normal grid/flex flow.
- Optimize for approximately `760px × 900px` visible browser area.

---

### Task 1: Responsive contract tests

**Files:**
- Modify: `src/__tests__/App.test.tsx`
- Modify: `src/components/ReasoningCanvas.tsx`

**Interfaces:**
- Produces: `data-layout-target="compact-split"` on the cockpit viewport.
- Produces: visible compact affordance text `Compact split-screen mode`.

- [ ] **Step 1: Write failing test**

```ts
expect(screen.getByTestId('reasoning-viewport')).toHaveAttribute('data-layout-target', 'compact-split');
expect(screen.getByText('Compact split-screen mode')).toBeInTheDocument();
```

- [ ] **Step 2: Run test and confirm failure**

Run: `npm test -- src/__tests__/App.test.tsx`

Expected: FAIL because compact layout affordances do not exist.

- [ ] **Step 3: Implement minimal DOM affordances**

Add the attribute and compact label without changing graph behavior.

- [ ] **Step 4: Run test and confirm pass**

Run: `npm test -- src/__tests__/App.test.tsx`

Expected: PASS.

### Task 2: Compact responsive CSS

**Files:**
- Modify: `src/index.css`
- Test: `src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: existing cockpit class names.
- Produces: desktop, tablet, compact, and dense breakpoints.

- [ ] **Step 1: Implement CSS breakpoints**

Use:

```css
@media (max-width: 1180px) {}
@media (max-width: 900px) {}
@media (max-width: 760px) {}
```

- [ ] **Step 2: Verify**

Run:

```bash
npm test
npm run typecheck
npm run build
git diff --check
```
