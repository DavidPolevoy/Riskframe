# Two-Lane Risk Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use cy:subagent-driven-development (recommended) or cy:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every initialized decision graph compare the proposed change path against the status quo, with explicit risk-management visibility for both paths.

**Architecture:** Extend the decision graph contract with option path metadata and risk-management roles, enforce baseline coverage in validation, and surface the comparison in the canvas, tool schema, and WebMCP context. Keep the graph schema version at `1` because this is an additive contract inside the current Signal Loom state shape.

**Tech Stack:** React, TypeScript, Vitest, Vite, WebMCP tool definitions/runtime.

## Global Constraints

- `initialize_decision_graph` must require at least one `change_path` option and one `status_quo` option.
- Missing downside, mitigation, tripwire, or evidence must become visible coverage gaps or `unknown` nodes, never silent absence.
- Do not reintroduce `start_decision`, numeric confidence, or summary-writing tools.
- Use TDD: failing test first, then implementation, then verification.

---

### Task 1: Decision graph contract and validator

**Files:**
- Modify: `src/domain/decisionGraph.ts`
- Test: `src/__tests__/decisionGraph.test.ts`
- Test: `src/__tests__/decisionGraphFixtures.ts`

**Interfaces:**
- Produces: `optionPaths`, `OptionPath`, `SemanticRole` including `mitigation` and `tripwire`, `RelationshipType` including `mitigated_by` and `monitored_by`.
- Produces: `DecisionNodeInput.optionPath?: OptionPath`; required for `role: 'option'`.
- Produces validation errors: `missing_change_path`, `missing_status_quo`, `missing_option_risk`, `unmanaged_risk`, `invalid_option_path`.

- [ ] **Step 1: Write failing tests**

Add tests asserting:

```ts
expect(validateDecisionGraph(snapshotWithChangeAndStatusQuo).ok).toBe(true);
expect(validateDecisionGraph(snapshotMissingStatusQuo).errors).toContainEqual(expect.objectContaining({ code: 'missing_status_quo' }));
expect(validateDecisionGraph(snapshotOptionWithoutRisk).errors).toContainEqual(expect.objectContaining({ code: 'missing_option_risk' }));
expect(validateDecisionGraph(snapshotRiskWithoutMitigationTripwireOrUnknown).errors).toContainEqual(expect.objectContaining({ code: 'unmanaged_risk' }));
```

- [ ] **Step 2: Run validator tests and confirm failure**

Run: `npm test -- src/__tests__/decisionGraph.test.ts`

Expected: FAIL because `optionPath`, `mitigation`, `tripwire`, and new validation errors do not exist yet.

- [ ] **Step 3: Implement contract and validation**

Update `src/domain/decisionGraph.ts` so:

```ts
export const optionPaths = ['change_path', 'status_quo', 'test_path'] as const;
export type OptionPath = (typeof optionPaths)[number];
```

and enforce:

- every option has a valid `optionPath`
- at least one option is `change_path`
- at least one option is `status_quo`
- every option has a direct `risks` edge to a risk node
- every risk has a direct `mitigated_by` edge to a mitigation, `monitored_by` edge to a tripwire, or `depends_on` edge to an unknown

- [ ] **Step 4: Run validator tests and confirm pass**

Run: `npm test -- src/__tests__/decisionGraph.test.ts`

Expected: PASS.

### Task 2: State, coverage, and tool contract

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/state/reducer.ts`
- Modify: `src/state/telemetry.ts`
- Modify: `src/tools/definitions.ts`
- Modify: `src/tools/runtime.ts`
- Modify: `src/tools/protocol.ts`
- Test: `src/__tests__/reducer.test.ts`
- Test: `src/__tests__/telemetry.test.ts`
- Test: `src/__tests__/tools.test.ts`

**Interfaces:**
- Consumes: `OptionPath`, `optionPaths`, new roles, and new relationships from Task 1.
- Produces: `ReasoningCard.optionPath?: OptionPath`.
- Produces: coverage items with `optionId`, `optionPath`, and missing risk-management dimensions.

- [ ] **Step 1: Write failing state/tool tests**

Add tests asserting:

```ts
expect(state.proposals.find((card) => card.id === 'option-status-quo')?.optionPath).toBe('status_quo');
expect(getGraphCoverage(state).options).toEqual(expect.arrayContaining([
  expect.objectContaining({ optionPath: 'change_path' }),
  expect.objectContaining({ optionPath: 'status_quo' }),
]));
expect(getToolNames()).toContain('get_signal_loom_context');
expect(JSON.stringify(getToolsForTier())).toContain('optionPath');
```

- [ ] **Step 2: Run targeted tests and confirm failure**

Run: `npm test -- src/__tests__/reducer.test.ts src/__tests__/tools.test.ts src/__tests__/telemetry.test.ts`

Expected: FAIL because state and tool schema do not preserve/expose `optionPath` yet.

- [ ] **Step 3: Implement state and tool support**

Update state construction, proposal dispatch, coverage calculation, telemetry signal, tool schemas, runtime validation, and protocol text to expose the two-lane requirement.

- [ ] **Step 4: Run targeted tests and confirm pass**

Run: `npm test -- src/__tests__/reducer.test.ts src/__tests__/tools.test.ts src/__tests__/telemetry.test.ts`

Expected: PASS.

### Task 3: Canvas and docs

**Files:**
- Modify: `src/components/ReasoningCanvas.tsx`
- Modify: `src/components/AgentSidebar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`
- Modify: `README.md`
- Test: `src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: `ReasoningCard.optionPath` and updated coverage shape.
- Produces: visible lane labels for “Change path” and “Status quo”, and card badges that distinguish the path.

- [ ] **Step 1: Write failing UI test**

Add a test asserting:

```ts
expect(screen.getByText('Change path')).toBeInTheDocument();
expect(screen.getByText('Status quo')).toBeInTheDocument();
```

- [ ] **Step 2: Run UI test and confirm failure**

Run: `npm test -- src/__tests__/App.test.tsx`

Expected: FAIL until lane labels are rendered.

- [ ] **Step 3: Implement UI and README changes**

Render the two path lanes, update card badges, and document that Signal Loom compares both the proposed route and the baseline route.

- [ ] **Step 4: Run UI test and confirm pass**

Run: `npm test -- src/__tests__/App.test.tsx`

Expected: PASS.

### Task 4: Full verification and live WebMCP test

**Files:**
- No source changes expected.

**Interfaces:**
- Consumes: built app at `http://127.0.0.1:5174/`.
- Produces: verification evidence.

- [ ] **Step 1: Run full local verification**

Run:

```bash
npm test
npm run typecheck
npm run build
git diff --check
ruff check .
pytest
```

Expected: frontend checks pass; Python checks may be unavailable in this repo and should be reported exactly if absent.

- [ ] **Step 2: Verify live WebMCP surface**

Through the open app, call:

```ts
get_signal_loom_context()
initialize_decision_graph(twoLaneSnapshot)
get_reasoning_graph()
```

Expected: available tools include `get_signal_loom_context` and `initialize_decision_graph`; initialized graph contains both `change_path` and `status_quo`; coverage reports both paths.
