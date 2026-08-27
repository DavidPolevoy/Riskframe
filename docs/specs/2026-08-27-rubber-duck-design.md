# Rubber Duck — Design Spec

## Thesis

Rubber Duck is an AI study companion that is structurally unable to give the answer. The WebMCP surface is the pedagogy: the agent can observe work and ask Socratic questions, while stronger help appears only when the learner explicitly spends a hint token.

## Visual direction

The interface is a focused study desk: warm paper surfaces, ink-colored text, restrained borders, and amber hint tokens. The problem canvas reads like a worksheet. The Duck sidebar is always visible and makes the live tool registry the demo centerpiece. Motion is purposeful: a newly unlocked tool fades/slides into the registry and a spent token visibly leaves the counter.

## Architecture

The app is a static React 18 + TypeScript + Vite site styled with Tailwind. There is no backend. A typed React Context and reducer own all client state: selected problem, ordered steps, annotations, telemetry, hint tier/tokens, and the current registered-tool snapshot. LocalStorage persists the active problem state only.

`src/data/problems.json` contains five LeetCode-style problems. Each record has an id, title, statement, and rubric milestones. `src/state/` contains domain types, reducer actions, telemetry helpers, and persistence. `src/tools/definitions.ts` exports all tool definitions, tier metadata, and descriptions. `src/tools/useTool.ts` feature-detects `document.modelContext` first and `navigator.modelContext` second, registers on mount, unregisters on cleanup, and re-registers when dependencies change. The hook reports registration state to the sidebar.

## Interaction and data flow

The main view is a two-column desk. The left problem canvas renders ordered step blocks. A block has an id, text, and `draft | flagged | checked` status; users can add, edit, delete, and move blocks. Focus is tracked from the active textarea. Keystrokes update idle timing and rewrite counts; editing an earlier step after a later step marks backtracking. Agent annotations render both in the sidebar feed and inline on their target block.

Tier 0 mounts at problem load: `get_problem`, `get_work`, `get_focus`, `get_stuck_signal`, `ask_question`, `place_flag`, and `award_check`. The help experience follows a Siko-like graduated ladder: start with a question, then offer a structurally similar analogy, then point at the category of the next move, and only then state one concrete next step. Spending a token is an explicit user action. Each spend decrements the three-token budget for the current problem and unlocks exactly the next rung: analogy, nudge, then concrete next step. Unlocked tools mount live and animate in the sidebar. No tool reveals a full solution.

The ladder is deliberately “smallest sufficient intervention.” The agent should prefer `ask_question` when the learner can productively continue, `give_analogy` when the concept needs a different surface, `give_nudge` when the learner needs directional help, and `reveal_next_step` only when the learner has spent through the final rung. The UI labels these as L1 Question, L2 Analogy, L3 Nudge, and L4 Next step so judges can see the escalation without confusing it with an answer key.

Tool handlers dispatch reducer actions and return exactly `{ content: [{ type: "text", text: string }] }`. Descriptions are exported constants written as system prompts: each states purpose, prohibitions, and when to prefer the tool over silence. If neither WebMCP API is present, a persistent setup banner explains ChatGPT’s in-app browser and Chrome 149+ testing flag, while the app remains usable as a local demo.

## Error handling and safety

Invalid step ids produce a text result explaining that the target does not exist and do not mutate state. Spending with zero tokens is a no-op text result. Tier tools are never registered before their tier is unlocked. Registration failures are captured in the UI status and do not prevent editing. State is normalized after every reducer action so deleted or reordered steps cannot leave dangling focus or annotations.

## Testing

Unit tests cover seed validation, reducer transitions, telemetry calculations, tool gating, and handler return shapes. A browser smoke test verifies the app loads, a seed problem can be solved in step blocks, a token spend visibly adds the tier-1 tool, and the WebMCP-unavailable banner appears when APIs are absent. `pnpm dev` is the documented local run command.

## Documentation and licensing

The root README explains why WebMCP is the point, includes a tool-surface table with tier and limitations, setup instructions, Chrome/in-app-browser enablement, a judge runbook, screenshot/GIF placeholders, and MIT licensing. A `.github/README.md` skeleton mirrors the challenge-facing project summary for public-repo readers.

## Out of scope

Auth, server code, persistence beyond localStorage, mobile-layout polish, more than five problems, chat UI, and any answer-revealing tool beyond the explicitly gated next-step tool are excluded.
