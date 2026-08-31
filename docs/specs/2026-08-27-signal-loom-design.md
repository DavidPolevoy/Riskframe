# Riskframe - Design Spec

## Thesis

Riskframe is a WebMCP-native reasoning debugger. The user states a messy decision in ChatGPT, ChatGPT proposes a visible reasoning graph through WebMCP, and the user accepts, parks, or rejects each proposed piece on the board. The page is not a chat wrapper; it is the shared visual state that makes hidden assumptions, conflicts, fragile paths, and parked ideas inspectable.

## Experience

The flow starts in ChatGPT. When the user states a decision in chat, ChatGPT calls `start_decision` through WebMCP with the decision text and a lens: personal, startup/product, or engineering/project. The page then shows a central decision node and auto-laid branches for options, consequences, assumptions, evidence, constraints, fears, and unknowns. The browser does not contain a manual decision intake form; it is the visualization and commit surface.

ChatGPT works through WebMCP proposal tools. Proposed cards and links appear as ghost objects until the user decides. Accepted proposals become the working graph. Parked proposals stay visible in a parking lot, where they can be updated, promoted, or highlighted when later accepted reasoning conflicts with them.

## Visual Model

The board blends a mind map and systems diagram. Cards have typed roles. Links show support, contradiction, dependency, or tension. Fragility appears as warning treatment on cards and paths. The parking lot is a live side area, not deleted history.

## WebMCP Surface

The initial tool surface exposes graph reads and proposal mutations:

- `start_decision`
- `get_reasoning_graph`
- `get_pending_proposals`
- `get_parking_lot`
- `propose_card`
- `propose_link`
- `flag_conflict`
- `flag_fragile_path`
- `score_confidence`
- `write_decision_summary`

Tools return `{ content: [{ type: "text", text }] }`. Mutation tools only create proposals or visible analysis markers; the user accepts, parks, rejects, or promotes items in the browser.

## Scope

V1 is a static React/Vite app. It uses auto-layout, drag-to-pan canvas navigation, scroll-wheel zoom, localStorage persistence, no backend, no auth, and no manual card dragging. The existing WebMCP registration hook remains the integration boundary.
