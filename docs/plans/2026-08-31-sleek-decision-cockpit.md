# Sleek Decision Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use cy:subagent-driven-development (recommended) or cy:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hard-to-read freeform graph presentation with a sleek, Figma-like decision cockpit that makes change-vs-status-quo risk comparison understandable and prevents card overlap by construction.

**Architecture:** Keep the existing WebMCP graph model and state reducer intact. Replace the visual canvas body with grid-stacked path columns and role sections, using CSS grid/flex layout instead of absolute card placement for the primary UI. Preserve zoom/pan affordances and existing accept/park/reject card actions.

**Tech Stack:** React, TypeScript, CSS grid/flexbox, Vitest, Testing Library, Vite.

## Global Constraints

- Do not change the WebMCP tool contract unless the visual design requires it.
- Do not use absolute-positioned cards in the primary decision view.
- Keep “Change path” and “Status quo” visible as first-class comparison columns.
- Preserve card actions: Accept, Park, Reject.
- Preserve zoom controls and current tests unless the test reflects the old design.

---

### Task 1: Cockpit UI structure

**Files:**
- Modify: `src/components/ReasoningCanvas.tsx`
- Test: `src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: `ReasoningCard.role`, `ReasoningCard.optionPath`, and visible cards from app state.
- Produces: DOM landmarks `data-testid="decision-cockpit"`, `data-testid="path-column-change_path"`, `data-testid="path-column-status_quo"`, and `data-testid="unassigned-card-stack"`.

- [ ] **Step 1: Write failing test**

```ts
expect(screen.getByTestId('decision-cockpit')).toBeInTheDocument();
expect(screen.getByTestId('path-column-change_path')).toBeInTheDocument();
expect(screen.getByTestId('path-column-status_quo')).toBeInTheDocument();
expect(screen.getByText('Risk management')).toBeInTheDocument();
```

- [ ] **Step 2: Run test and confirm failure**

Run: `npm test -- src/__tests__/App.test.tsx`

Expected: FAIL because the cockpit structure does not exist.

- [ ] **Step 3: Implement cockpit structure**

Render a hero decision brief above a two-column comparison board. Group option cards into their path columns and group risk/mitigation/tripwire/unknown cards into stacked role sections.

- [ ] **Step 4: Run test and confirm pass**

Run: `npm test -- src/__tests__/App.test.tsx`

Expected: PASS.

### Task 2: Sleek visual system and overlap prevention

**Files:**
- Modify: `src/index.css`
- Test: `src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: cockpit class names from Task 1.
- Produces: grid/flex card stacks where `.reason-card` is no longer absolutely positioned in the primary view.

- [ ] **Step 1: Write failing test**

```ts
expect(screen.getByTestId('decision-cockpit')).toHaveClass('decision-cockpit');
expect(screen.getAllByTestId('cockpit-card').length).toBeGreaterThan(0);
```

- [ ] **Step 2: Run test and confirm failure**

Run: `npm test -- src/__tests__/App.test.tsx`

Expected: FAIL until the cards are rendered through the cockpit stack.

- [ ] **Step 3: Implement CSS**

Use a polished neutral dark theme, rounded panels, soft shadows, path accents, card stacks, and responsive single-column behavior under 900px.

- [ ] **Step 4: Verify**

Run: `npm test -- src/__tests__/App.test.tsx`, `npm run typecheck`, and visually inspect the local app.
