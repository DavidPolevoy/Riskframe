# Riskframe

**A visual risk debugger for decisions.**

Riskframe is a WebMCP Challenge entry for people who need to see the structure and risk profile of a decision before committing. The user states a messy decision in ChatGPT, and ChatGPT initializes a validated decision graph in the browser through WebMCP. Every initialized graph must compare the proposed change path against the status quo path, including the risks of moving forward and the risks of keeping the regular route. ChatGPT can inspect the graph, propose grounded cards and links, flag conflicts, and mark fragile paths without inventing hidden certainty.

The important part: agent output is visual and reversible. Proposed cards stay as draft objects until the user accepts, parks, or rejects them. Parked ideas remain visible in a side lot and can be promoted later when new reasoning makes them relevant again.

Riskframe persists board state only in the current browser’s local storage. It has no backend database for decision graphs, so one user’s board is not sent to another user, browser, or device.

## Why WebMCP is the point, not the plumbing

Chat alone can summarize a decision. Riskframe uses WebMCP to maintain a shared spatial reasoning model that chat normally flattens:

- The page sends ChatGPT the graph, draft proposals, parked ideas, links, conflicts, fragile paths, coverage gaps, and app protocol.
- ChatGPT acts through constrained graph operations instead of free-form advice.
- The graph makes “do nothing / keep current route” a first-class option, not an unstated default.
- The user decides what becomes accepted reasoning in the browser.
- The parking lot keeps rejected/deferred ideas retrievable, reducing duplicate agent work.
- The visible graph shows hidden dependencies, unsupported assumptions, and stale parked concerns.

## Tool surface

| Tool | What it does |
| --- | --- |
| `get_riskframe_context` | Reads the app protocol so connected ChatGPT knows to use the open WebMCP page as the live test surface |
| `initialize_decision_graph` | Atomically initializes the visible graph from a validated decision snapshot with `change_path` and `status_quo` options |
| `get_reasoning_graph` | Reads graph state, coverage, source references, markers, and protocol metadata |
| `get_pending_proposals` | Reads visible draft cards and proposed links |
| `get_parking_lot` | Reads parked reasoning for retrieval and conflict checks |
| `propose_card` | Adds a draft card with role, epistemic status, basis, and source references |
| `propose_link` | Adds a draft typed relationship between existing cards |
| `flag_conflict` | Marks a conflict between current and parked reasoning |
| `flag_fragile_path` | Marks a weak dependency path in the decision graph |

## Run locally

```bash
pnpm install
pnpm dev
```

## Live demo

Riskframe is deployed on ChatGPT Sites:

https://riskframe.davidpolevoy96.chatgpt.site

The app is a static Vite site with a lightweight Sites worker entry for production hosting.

## Enable WebMCP

ChatGPT’s in-app browser supports WebMCP when the selected model and account support site tools. In Chrome, enable `chrome://flags/#enable-webmcp-testing` (Chrome 149+) and relaunch. Without WebMCP, Riskframe stays usable and shows a setup banner explaining the missing capability.

## Judge runbook

1. Open the live demo in ChatGPT’s in-app browser with a WebMCP-capable model.
2. In ChatGPT, ask the agent to map a messy decision, such as: “Should we pivot this project or keep refining it?”
3. Use WebMCP to call `get_riskframe_context`, then `initialize_decision_graph` with at least one `change_path` option and one `status_quo` option.
4. Use WebMCP to call `get_reasoning_graph`, then `propose_card` or `flag_fragile_path`.
5. Confirm the proposed card appears as a draft object on the canvas.
6. Park a proposal and confirm it remains in the parking lot.
7. Use `flag_conflict` to connect accepted reasoning with a parked concern.
8. Confirm every tool result uses `{ content: [{ type: "text", text }] }`.

## Screenshots and demo

<!-- Placeholder: add a desktop screenshot of the reasoning canvas. -->
![Riskframe canvas screenshot](docs/assets/signal-loom-desktop.png)

<!-- Placeholder: add a short GIF showing a draft proposal moving into the parking lot. -->
![Riskframe draft proposal demo](docs/assets/signal-loom-ghost-layer.gif)

## License

MIT. See [LICENSE](LICENSE).
