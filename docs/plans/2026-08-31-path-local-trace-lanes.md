# Path-local trace lanes

## Goal

Make the decision board understandable without forcing the user to visually follow loose cross-board connections.

## Change

- Render each decision option as its own vertical trace.
- Place linked outcomes, risks, mitigations, tripwires, unknowns, and evidence inside that option trace.
- Label each relationship inline: `leads to`, `risks`, `mitigated by`, `monitored by`, and `evaluated by`.
- Remove the global risk/supporting-signal strips from the primary cockpit view.
- Keep the existing compact split-screen target so the board remains usable beside ChatGPT on a 14-inch MacBook.

## Verification

- Add a UI test proving the change path and status quo traces each contain their connected risk-management cards.
- Run the focused app test suite.
- Run typecheck/build and repository-required verification commands where available.
