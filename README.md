# Rubber Duck

**An AI study companion that is structurally unable to give you the answer.**

Rubber Duck is a WebMCP Challenge entry for learners who want to solve problems, not paste them into an answer engine. You write the reasoning as ordered steps. The Duck can inspect your work, ask a Socratic question, and notice when you are stuck—but stronger help only becomes discoverable when you explicitly spend a hint token.

## Why WebMCP is the point, not the plumbing

Most “Socratic tutor” products promise restraint in a system prompt. Rubber Duck makes restraint observable and enforceable at the browser protocol layer. The agent’s tool surface is the pedagogy:

- Tier 0 tools can read the problem, read your work, observe focus/stuck signals, ask questions, flag a step, and award a defended check.
- Spending a token mounts exactly one stronger tool live.
- The sidebar shows the agent’s current capabilities, including locked rungs.

The result is a collaboration where the learner controls escalation and the agent cannot even discover a stronger intervention early.

## Tool surface

| Tool | Tier | What it cannot do |
| --- | ---: | --- |
| `get_problem` | 0 | Cannot reveal a solution |
| `get_work` | 0 | Cannot rewrite learner steps |
| `get_focus` | 0 | Cannot infer an unfocused answer |
| `get_stuck_signal` | 0 | Cannot diagnose the learner |
| `ask_question` | 0 | Questions only, ≤2 sentences, never answer-containing statements |
| `place_flag` | 0 | Wordless marker only |
| `award_check` | 0 | Cannot certify undefended reasoning |
| `give_analogy` | 1 | Must use a different but structurally similar problem; no actual solution |
| `give_nudge` | 2 | One category-level sentence; never the concrete move |
| `reveal_next_step` | 3 | One next step only; never a full solution |

## Run locally

```bash
pnpm install
pnpm dev
```

The app is a static Vite site and can be deployed to Netlify, Vercel, or any static host.

## Enable WebMCP

ChatGPT’s in-app browser supports WebMCP out of the box. In Chrome, enable `chrome://flags/#enable-webmcp-testing` (Chrome 149+) and relaunch. Without WebMCP, Rubber Duck stays fully usable and shows a setup banner explaining the missing capability.

## Judge runbook

1. Open the app and use the seeded **Two Sum** canvas.
2. Add two or three reasoning steps; edit and reorder them.
3. Confirm the sidebar shows Tier 0 tools and **3 hint tokens**.
4. Spend one token. `give_analogy` should animate into the live tool surface while the counter drops to 2.
5. In a WebMCP-capable browser, inspect the registered tools in DevTools’ WebMCP panel and call them. Every result uses `{ content: [{ type: "text", text }] }`.
6. Spend the remaining tokens to reveal the nudge and one-next-step rungs. A full solution is never exposed.

## Screenshots and demo

<!-- Placeholder: add a desktop screenshot of the study desk. -->
![Study desk screenshot](docs/assets/rubber-duck-desktop.png)

<!-- Placeholder: add a short GIF showing a token spend and tool registration animation. -->
![Hint ladder demo](docs/assets/rubber-duck-hint-ladder.gif)

## License

MIT. See [LICENSE](LICENSE).
