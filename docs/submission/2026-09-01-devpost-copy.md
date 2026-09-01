# Riskframe Devpost copy

## Project

Riskframe

## Live demo

https://riskframe.davidpolevoy96.chatgpt.site

## Source code

https://github.com/DavidPolevoy/Riskframe

## Short description

Riskframe is a visual risk debugger for messy continue-vs-pivot decisions. It uses WebMCP to let ChatGPT initialize and inspect a shared decision graph in the browser instead of flattening the decision into chat text.

## What it does

Riskframe turns a vague decision into a visible graph with two required lanes: the proposed change path and the status quo path. The graph shows risks, assumptions, mitigations, signals, conflicts, fragile paths, and parked ideas. ChatGPT can read the current graph through WebMCP and propose constrained updates, while the user keeps control over what becomes accepted reasoning.

## Why it matters

Most AI-assisted decisions collapse into one recommended path and hide the cost of doing nothing. Riskframe makes both sides visible: the risk of moving forward and the risk of staying on the regular path. That makes the reasoning easier to challenge, revise, and reuse.

## Built with

- React
- TypeScript
- Vite
- WebMCP
- ChatGPT Sites

## Suggested judging flow

1. Open the live demo in ChatGPT’s in-app browser with WebMCP available.
2. Ask ChatGPT: “Should we pivot this project or keep refining it?”
3. Have ChatGPT call `get_riskframe_context`.
4. Have ChatGPT call `initialize_decision_graph` with one change path and one status quo path.
5. Inspect the board, propose a draft card, park an idea, and flag a fragile path or conflict.

## Demo video

To be added before final Devpost submission.
