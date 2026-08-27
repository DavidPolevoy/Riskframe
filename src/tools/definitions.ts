export interface ToolDefinition { name: string; tier: number; summary: string; description: string; inputSchema: Record<string, unknown>; execute?: (input: Record<string, string>) => unknown; }

export const DESCRIPTIONS = {
  get_problem: 'Return the current problem and rubric milestones. Use this to understand the task before asking anything; never infer or reveal a solution.',
  get_work: 'Return the learner’s ordered step blocks. Use this to ground feedback in their actual work; never replace, rewrite, or complete a step.',
  get_focus: 'Return the step currently holding the learner’s cursor, or null. Use this to target one question; prefer silence if no focused step exists.',
  get_stuck_signal: 'Return idle time, rewrite count, and backtracking for the focused step. Use this to decide whether a gentle question is warranted; never diagnose the learner.',
  ask_question: 'Attach one Socratic question to a step. Questions only, never statements containing the answer, at most 2 sentences; prefer this over stronger help when the learner can productively continue.',
  place_flag: 'Place a wordless review marker on a step. Use when a step deserves another look without explaining why; never include a solution.',
  award_check: 'Mark a step verified after the learner has defended their reasoning. Use only when their explanation supports the milestone; never certify an unexamined answer.',
  give_analogy: 'Offer an analogous but structurally different problem for the learner to reason through. Never reference or reveal the actual problem’s solution; prefer this when a new surface would unlock understanding.',
  give_nudge: 'Give one sentence naming only the category of the next move, such as a data-structure property. Never state the move itself; prefer this only after the learner has spent the analogy rung.',
  reveal_next_step: 'State exactly one concrete next step and nothing beyond it. Never provide the full solution; use only when the learner has explicitly unlocked the final rung.',
} as const;

const base = (name: string, tier: number, summary: string): ToolDefinition => ({ name, tier, summary, description: DESCRIPTIONS[name as keyof typeof DESCRIPTIONS], inputSchema: { type: 'object', properties: {} } });
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  base('get_problem', 0, 'Read the problem and rubric'), base('get_work', 0, 'Read ordered learner steps'), base('get_focus', 0, 'Read focused step'), base('get_stuck_signal', 0, 'Read stuck telemetry'),
  { ...base('ask_question', 0, 'Ask a Socratic question'), inputSchema: { type: 'object', properties: { stepId: { type: 'string' }, text: { type: 'string' } }, required: ['stepId', 'text'] } },
  { ...base('place_flag', 0, 'Mark a step for review'), inputSchema: { type: 'object', properties: { stepId: { type: 'string' } }, required: ['stepId'] } },
  { ...base('award_check', 0, 'Verify defended reasoning'), inputSchema: { type: 'object', properties: { stepId: { type: 'string' } }, required: ['stepId'] } },
  { ...base('give_analogy', 1, 'Offer a parallel problem'), inputSchema: { type: 'object', properties: { stepId: { type: 'string' } }, required: ['stepId'] } },
  { ...base('give_nudge', 2, 'Point at a move category'), inputSchema: { type: 'object', properties: { stepId: { type: 'string' } }, required: ['stepId'] } },
  { ...base('reveal_next_step', 3, 'Reveal one next step'), inputSchema: { type: 'object', properties: { stepId: { type: 'string' } }, required: ['stepId'] } },
];
export function getToolsForTier(tier: number) { return TOOL_DEFINITIONS.filter((tool) => tool.tier === 0 || tool.tier <= tier); }
