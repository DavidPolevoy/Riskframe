# Riskframe OpenAI Sites Deployment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use cy:subagent-driven-development (recommended) or cy:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Riskframe to ChatGPT Sites so the WebMCP Challenge submission has a judge-accessible live URL.

**Architecture:** Riskframe is currently a Vite React static app with browser-side WebMCP registration. The deployment path is to add ChatGPT Sites hosting metadata and the Sites Vite integration, validate the production build, create a Sites project, save a version from the exact pushed source, deploy it, then test the deployed URL in ChatGPT’s in-app browser for WebMCP tool discovery.

**Tech Stack:** Vite, React, TypeScript, Vitest, WebMCP browser tool registration, ChatGPT Sites.

## Global Constraints

- Challenge deadline: September 3, 2026 at 1:00 PM Pacific Time.
- Submission needs a working live URL judges can access in ChatGPT’s in-app browser or Chrome with WebMCP enabled.
- Submission needs a public source repository with an open-source license.
- Submission needs a text description explaining WebMCP fit, UX improvement, human-agent collaboration, and implementation.
- Submission needs a public demo video under 3 minutes with audio.
- Do not edit the submitted repo/live site after the deadline during judging.
- Preserve `signal-loom-state-v2` localStorage key unless a migration is intentionally added; it preserves existing browser sessions.
- Keep `.superpowers/` out of source commits.

---

## File Structure

- Modify: `package.json`
  - Add the Sites Vite integration dependency if required.
  - Keep existing `dev`, `build`, `test`, and `typecheck` scripts.
- Modify: `vite.config.ts`
  - Add the Sites Vite plugin while preserving the React plugin.
- Create: `.openai/hosting.json`
  - Store only Sites-managed hosting linkage, starting with the `project_id` returned by Sites.
- Modify: `README.md`
  - Add the deployed URL, challenge testing instructions, and a judge runbook that names `get_riskframe_context`.
- Optional create: `docs/submission/2026-09-01-devpost-copy.md`
  - Draft the Devpost text fields separately from the README.

## Task 1: Confirm pre-deploy source is clean and public

**Files:**
- Read: `README.md`
- Read: `LICENSE`
- Read: `package.json`

**Interfaces:**
- Consumes: current `main` branch and `origin` remote.
- Produces: verified baseline before hosting changes.

- [ ] **Step 1: Check repository identity**

```bash
git remote -v
gh repo view DavidPolevoy/Riskframe --json nameWithOwner,url,visibility,defaultBranchRef
```

Expected: remote points to `DavidPolevoy/Riskframe`, default branch is `main`, and visibility is public before Devpost submission.

- [ ] **Step 2: Check working tree**

```bash
git status --short --branch
```

Expected: no source changes except intentionally ignored local scratch files such as `.superpowers/`.

- [ ] **Step 3: Confirm license exists**

```bash
test -f LICENSE
```

Expected: exit code `0`.

## Task 2: Add ChatGPT Sites build integration

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

**Interfaces:**
- Consumes: existing Vite React app.
- Produces: production build compatible with Sites packaging.

- [ ] **Step 1: Install Sites Vite integration**

```bash
npm install --save-dev @openai/sites-vite-plugin
```

Expected: dependency is added and lockfile is updated.

- [ ] **Step 2: Update Vite config**

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sites } from '@openai/sites-vite-plugin';

export default defineConfig({
  plugins: [react(), sites()],
});
```

Expected: Vite still starts locally and `npm run build` emits the Sites-compatible output required by the plugin.

- [ ] **Step 3: Verify the integration**

```bash
npm run typecheck
npm run build
```

Expected: both commands pass.

## Task 3: Create the ChatGPT Sites project

**Files:**
- Create: `.openai/hosting.json`

**Interfaces:**
- Consumes: verified build from Task 2.
- Produces: a Sites project named `Riskframe` and a persisted `project_id`.

- [ ] **Step 1: Create a Sites project**

Use the Sites connector to create a site:

```text
title: Riskframe
slug: riskframe
description: Visual risk decision debugger for WebMCP-powered continue-vs-pivot decisions.
```

Expected: Sites returns a project id and source write credential. Persist the project id exactly in `.openai/hosting.json`.

- [ ] **Step 2: Verify hosting metadata is minimal**

`.openai/hosting.json` should contain only Sites linkage and optional logical bindings. For Riskframe v1, no D1/R2/auth bindings are needed.

Expected shape:

```json
{
  "project_id": "<opaque-sites-project-id>"
}
```

Do not invent or alter the `project_id`.

## Task 4: Validate source after hosting metadata

**Files:**
- Read: changed source tree

**Interfaces:**
- Consumes: Tasks 2 and 3 changes.
- Produces: deployable source state.

- [ ] **Step 1: Run frontend verification**

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Expected: all pass.

- [ ] **Step 2: Attempt repo-required Python verification**

```bash
ruff check .
pytest
```

Expected in this frontend repo today: commands may be unavailable. If unavailable, record that explicitly in the deployment notes instead of blocking the Sites deploy.

## Task 5: Commit and push exact deploy source

**Files:**
- Commit: `package.json`
- Commit: `pnpm-lock.yaml` or npm lockfile if dependency tooling changes it
- Commit: `vite.config.ts`
- Commit: `.openai/hosting.json`
- Commit: `README.md` and `docs/submission/*` if updated

**Interfaces:**
- Consumes: validated source state.
- Produces: Git commit SHA used for Sites version provenance.

- [ ] **Step 1: Stage only source and docs**

```bash
git add package.json pnpm-lock.yaml vite.config.ts .openai README.md docs/submission
git status --short
```

Expected: `.superpowers/` is not staged.

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: prepare riskframe sites deployment"
```

Expected: commit succeeds with no `Co-Authored-By` trailer.

- [ ] **Step 3: Push**

```bash
git push origin main
git rev-parse HEAD
```

Expected: `origin/main` contains the exact commit SHA that will be used for the Sites version.

## Task 6: Save and deploy a Sites version

**Files:**
- Read: `.openai/hosting.json`
- Read: `dist/`

**Interfaces:**
- Consumes: pushed commit SHA and successful local build.
- Produces: production Sites deployment URL.

- [ ] **Step 1: Package the built app**

Use the Sites hosting package helper for the project directory and an archive in `/tmp`.

Expected: archive contains the successful build output and `.openai/hosting.json`.

- [ ] **Step 2: Save a Sites version**

Use the Sites connector to save a version with:

```text
project_id: value from .openai/hosting.json
commit_sha: output from git rev-parse HEAD
archive: packaged build archive path
```

Expected: Sites returns a saved version id.

- [ ] **Step 3: Deploy**

If the site is still verified owner-only, use private deployment. If the site is public/shared or access cannot be verified, get explicit approval before production deployment.

Expected: deployment succeeds and returns a production URL.

## Task 7: Test the deployed URL for challenge readiness

**Files:**
- Modify: `README.md`
- Optional modify: `docs/submission/2026-09-01-devpost-copy.md`

**Interfaces:**
- Consumes: production Sites URL.
- Produces: verified judge runbook.

- [ ] **Step 1: Open deployed URL**

Open the production URL in ChatGPT’s in-app browser.

Expected: the app loads as Riskframe and auto-populates a two-sided demo board if state is empty.

- [ ] **Step 2: Verify WebMCP tools**

In ChatGPT’s in-app browser, fetch page tools and call:

```text
get_riskframe_context
get_reasoning_graph
```

Expected: tool calls return `{ content: [{ type: "text", text: "..." }] }`, show app `Riskframe`, and report initialized graph state.

- [ ] **Step 3: Verify mutation flow**

Call:

```text
propose_card
```

with a grounded `claim`, `criterion`, or `unknown` card.

Expected: the card appears as a draft object in the visible board and can be parked/rejected/accepted.

- [ ] **Step 4: Update README with live URL**

Add:

```markdown
## Live demo

[Open Riskframe](<production-sites-url>)
```

Expected: README gives judges the live URL and the WebMCP testing path.

## Task 8: Prepare Devpost submission material

**Files:**
- Create: `docs/submission/2026-09-01-devpost-copy.md`

**Interfaces:**
- Consumes: deployed URL and verified runbook.
- Produces: paste-ready Devpost copy.

- [ ] **Step 1: Draft required text sections**

Create sections:

```markdown
# Devpost Submission Copy

## Project description
Riskframe is a visual risk debugger for messy decisions. It uses WebMCP so ChatGPT can initialize, inspect, and extend a decision graph in the browser instead of flattening the decision into prose.

## Why WebMCP is a strong fit
Riskframe is useful only when the web page and agent share structured state. ChatGPT contributes graph operations; the browser preserves a visible, reversible decision artifact.

## Better user experience
Every decision compares the proposed change path against the status quo path. Each path carries its own risks, mitigations, tripwires, unknowns, and evidence, so “do nothing” is no longer invisible.

## Human-agent collaboration
The agent proposes structure; the human accepts, parks, or rejects it. Parked reasoning remains retrievable, and the agent can flag conflicts or fragile paths later.

## WebMCP implementation
Riskframe registers browser tools with `document.modelContext.registerTool`, including `get_riskframe_context`, `initialize_decision_graph`, `get_reasoning_graph`, `propose_card`, `propose_link`, `flag_conflict`, and `flag_fragile_path`.

## Links
- Live app: <production-sites-url>
- Code: https://github.com/DavidPolevoy/Riskframe
- Demo video: <youtube-url>
```

Expected: copy covers every challenge-required text point.

- [ ] **Step 2: Record demo video checklist**

Use a sub-3-minute script:

```text
0:00 Problem: chat advice collapses decisions into prose.
0:20 Open Riskframe and show both paths.
0:45 Call get_riskframe_context from ChatGPT.
1:05 Initialize or inspect graph through WebMCP.
1:35 Propose a card and show it appears as draft.
2:00 Park/reject/accept to show human control.
2:25 Close with why status quo risk is visible.
```

Expected: video demonstrates a working deployed app and explicitly explains WebMCP.

## Task 9: Freeze submitted version

**Files:**
- Read: GitHub repo
- Read: Devpost submission

**Interfaces:**
- Consumes: final submitted URL, repo, and video.
- Produces: eligibility-safe freeze point.

- [ ] **Step 1: Tag submitted source**

```bash
git tag webmcp-submission-2026-09-03
git push origin webmcp-submission-2026-09-03
```

Expected: immutable reference to the submitted source.

- [ ] **Step 2: Stop editing submitted assets after deadline**

After September 3, 2026 at 1:00 PM PT, do not edit the submitted Devpost entry, repo, live site, or video during judging.

Expected: if continued development is needed, fork the repo and continue outside the submitted artifact.

## Self-Review

- Spec coverage: live URL, public repo, WebMCP testing, Devpost text, and demo video are covered.
- Placeholder scan: remaining placeholders are only execution-time values that cannot exist until deployment: Sites project id, production URL, and YouTube URL.
- Type consistency: active WebMCP tool name is `get_riskframe_context`; old `get_signal_loom_context` is not used in the deployment flow.
