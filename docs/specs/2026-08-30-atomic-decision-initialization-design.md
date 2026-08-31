# Atomic Decision Initialization Design

## Problem

Riskframe currently creates hard-coded “continue” and “pivot” proposals when a decision starts. Those proposals are unrelated to many user decisions. The graph also conflates a node’s role, its truth status, and the user’s review status. Arbitrary confidence values and unconstrained summaries make model-authored prose look more grounded than it is.

The application must instead let the connected ChatGPT construct the entire initial decision graph from the current conversation. Missing information must remain visible as unknown rather than forcing an intake interview or being silently invented.

## Goals

- Initialize a coherent decision graph through one WebMCP call: `initialize_decision_graph`.
- Preserve the user’s original wording while allowing ChatGPT to normalize the decision.
- Infer an initial graph automatically without asking intake questions.
- Separate semantic role, epistemic status, and user review status.
- Reject invalid snapshots atomically so users never see partial graphs.
- Make uncertainty, provenance, and missing evidence visible.
- Replace model-authored numeric confidence with graph-derived coverage signals.

## Non-goals

- Proving that an inferred claim is true.
- Giving website-provided instructions higher priority than ChatGPT’s instruction hierarchy.
- Adding a backend, authentication, external model call, or search service.
- Guaranteeing that ChatGPT invokes WebMCP in every possible session.
- Supporting incremental migration of previously stored graph state.

## Architecture

The page registers `initialize_decision_graph` as a WebMCP site tool. Its description tells the connected ChatGPT to call it immediately after recognizing that the user has expressed a decision, infer a useful first draft from the current conversation, avoid an intake interview, and represent missing information as unknown nodes.

The runtime validates the complete payload before dispatching one reducer action. Successful validation replaces the current decision state with the supplied snapshot. Failed validation returns structured errors and leaves state unchanged. The page itself contributes no options, consequences, assumptions, or other decision content.

The initialization flow is:

1. The user expresses a decision in the ChatGPT conversation.
2. ChatGPT infers the frame, options, criteria, constraints, consequences, risks, claims, and unknowns.
3. ChatGPT calls `initialize_decision_graph` once with a complete snapshot.
4. Riskframe validates the snapshot without mutating state.
5. Riskframe atomically renders the snapshot as a draft graph.
6. Existing proposal-review interactions let the user accept, park, or reject inferred material.

## Payload Contract

The WebMCP input has this conceptual shape:

```ts
interface InitializeDecisionGraphInput {
  schemaVersion: 1;
  decision: {
    originalText: string;
    normalizedQuestion: string;
    objective: string;
    timeHorizon: string | null;
  };
  nodes: DecisionNodeInput[];
  edges: DecisionEdgeInput[];
  sourceRefs: SourceReferenceInput[];
}

type SemanticRole =
  | 'option'
  | 'criterion'
  | 'constraint'
  | 'claim'
  | 'consequence'
  | 'risk'
  | 'unknown';

type EpistemicStatus =
  | 'user_stated'
  | 'sourced'
  | 'inferred'
  | 'forecast'
  | 'unknown';

interface DecisionNodeInput {
  id: string;
  role: SemanticRole;
  label: string;
  detail: string;
  epistemicStatus: EpistemicStatus;
  basis: string;
  sourceRefIds: string[];
}

type RelationshipType =
  | 'option_for'
  | 'evaluated_by'
  | 'constrained_by'
  | 'supports'
  | 'contradicts'
  | 'leads_to'
  | 'risks'
  | 'depends_on';

interface DecisionEdgeInput {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  rationale: string;
}

interface SourceReferenceInput {
  id: string;
  label: string;
  url: string | null;
  excerpt: string | null;
}
```

`basis` explains why ChatGPT included a node. It is not a citation. A `sourced` node must reference at least one declared source. A conversation-derived user statement uses `user_stated`, not `sourced`, unless a real source is also supplied.

## State Semantics

Each graph node has three independent dimensions:

1. **Semantic role:** what the node contributes to the decision.
2. **Epistemic status:** how the claim entered the graph and what kind of knowledge it represents.
3. **Review status:** whether the user has accepted, parked, or rejected the draft.

Review status is owned by the application. All incoming nodes begin as `draft`, except the preserved original decision statement, which is displayed as user-provided context. Accepting a node does not upgrade its epistemic status.

The application does not accept a numeric confidence value from ChatGPT. Instead, it computes coverage signals from graph structure, including whether each option has criteria, consequences, risks, supporting material, and unresolved unknowns.

## Validation

Validation is pure and runs before reducer dispatch. The snapshot is accepted only when all invariants hold:

- `schemaVersion` equals `1`.
- Decision text, normalized question, and objective are non-empty.
- The graph contains two to four distinct option nodes.
- Every node ID, edge ID, and source ID is unique.
- Every node has a supported semantic role and epistemic status.
- Every inferred or forecast node has a non-empty basis.
- Every sourced node references at least one declared source.
- Every source reference used by a node exists.
- Every edge endpoint references the decision root or an existing node.
- Every option connects to the decision root.
- Every consequence and risk connects to at least one option.
- Unknown nodes cannot be marked as sourced.

Validation returns a discriminated result containing either the normalized snapshot or a list of errors with a stable code, path, and human-readable message. Failure never mutates application state. The tool result serializes these errors so ChatGPT can repair and retry the entire call.

## Runtime and Revision Flow

`initialize_decision_graph` replaces `start_decision` and removes reducer-owned starter proposals. The initialization handler validates the payload and dispatches one `initializeDecisionGraph` action on success.

The existing graph-read tools remain available after initialization. Follow-up proposal tools can refine the graph, but they must use the same role, epistemic, basis, and source-reference semantics. `score_confidence` is removed. `write_decision_summary` remains only if its input becomes a structured, graph-grounded summary; it must not write arbitrary unsupported prose.

Submitting a second valid initialization snapshot intentionally replaces the current session. The reset control remains available. Stored state includes `schemaVersion`; incompatible or legacy state falls back to a clean initial state rather than being guessed into the new model.

## Interface Changes

- Empty state: “Waiting for ChatGPT to initialize a decision graph.”
- Decision header: original wording plus normalized decision frame and objective.
- Cards: display semantic role and epistemic badge separately.
- Draft controls: accept, park, and reject remain visible without implying verification.
- Confidence bars: removed.
- Coverage panel: reports structural gaps by option and criterion.
- Validation failures: remain in the WebMCP tool result; the canvas does not flash partial content.
- Tool sidebar: lists `initialize_decision_graph` and removes `start_decision` and `score_confidence`.

## Error Handling

- Invalid input returns all detectable validation errors in one response.
- Unknown schema versions return `unsupported_schema_version`.
- Duplicate identifiers return `duplicate_id` with the conflicting path.
- Broken references return `unknown_reference`.
- Invalid provenance combinations return `invalid_epistemic_state`.
- Missing option coverage returns `insufficient_options` or `unconnected_option`.
- Runtime exceptions return a generic failure result and preserve the previous state.
- Local storage parsing or version failures produce a clean empty state.

## Testing Strategy

Tests cover the contract rather than model quality:

- Schema tests assert that the WebMCP tool requires the complete snapshot shape.
- Validator tests cover every invariant and prove invalid snapshots do not dispatch.
- Reducer tests prove one successful action replaces state atomically and creates no hard-coded cards.
- Runtime tests prove structured success and failure tool results.
- Persistence tests prove supported snapshots reload and incompatible snapshots reset safely.
- Component tests prove epistemic and review statuses render independently.
- Component tests prove confidence bars are absent and coverage gaps are visible.
- Integration tests initialize unrelated personal, startup, and engineering decisions and assert that no project-pivot copy appears unless supplied in the payload.
- Existing reset, WebMCP registration, zoom, pan, accept, park, and reject behavior remains covered.

Verification commands are:

```bash
npm test
npm run typecheck
npm run build
```

The repository instructions also request `ruff check .` and `pytest`. This repository contains no Python project, so those commands are expected to be unavailable or report no Python targets; that outcome will be recorded rather than treated as JavaScript verification.

## Blast Radius

The change affects the shared decision state contract, reducer initialization, persistence format, WebMCP definitions and runtime, graph rendering, telemetry, and their tests. All consumers of `AppState`, `ReasoningCard`, and current tool names must be updated together. The work does not alter dependencies, build configuration, deployment configuration, or external services.

The design isolates new responsibilities into a payload validator and coverage calculator so WebMCP transport, state mutation, and UI rendering do not each reinvent validation or epistemic logic.
