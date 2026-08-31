import { epistemicStatuses, optionPaths, relationshipTypes, semanticRoles } from '../domain/decisionGraph';

export interface ToolDefinition { name: string; tier: number; summary: string; description: string; inputSchema: Record<string, unknown>; execute?: (input: Record<string, unknown>) => unknown; }

export const DESCRIPTIONS = {
  get_riskframe_context: 'Return the app-level protocol for connected ChatGPT sessions. Use this first when testing or operating Riskframe through WebMCP so the open page remains the live source of truth.',
  initialize_decision_graph: 'Atomically initialize or replace the visible decision graph from the current ChatGPT session. Use this automatically when the user expresses a decision; infer options from the conversation, include both change_path and status_quo, and mark gaps as unknown instead of asking intake questions.',
  get_reasoning_graph: 'Return the visible reasoning graph, decision frame, links, source references, analysis markers, and coverage gaps. Use this before proposing structure.',
  get_pending_proposals: 'Return draft cards and links that are visible but not accepted. Use this to avoid duplicate proposals.',
  get_parking_lot: 'Return parked cards the user declined or deferred. Use this before proposing ideas that may already exist off-canvas.',
  propose_card: 'Create a draft reasoning card with role, epistemic status, basis, and source references. Do not treat the proposal as accepted.',
  propose_link: 'Create a draft relationship between existing cards. Both endpoints must already exist.',
  flag_conflict: 'Mark a visible conflict between an accepted card and another visible card, including parked cards.',
  flag_fragile_path: 'Mark a visible fragile reasoning path when a decision depends on unresolved or weak upstream material.',
} as const;

const base = (name: keyof typeof DESCRIPTIONS, tier: number, summary: string): ToolDefinition => ({
  name,
  tier,
  summary,
  description: DESCRIPTIONS[name],
  inputSchema: { type: 'object', properties: {} },
});

const nodeProperties = {
  id: { type: 'string' },
  role: { type: 'string', enum: semanticRoles },
  label: { type: 'string' },
  detail: { type: 'string' },
  epistemicStatus: { type: 'string', enum: epistemicStatuses },
  basis: { type: 'string' },
  sourceRefIds: { type: 'array', items: { type: 'string' } },
  optionPath: { type: 'string', enum: optionPaths, description: 'Required when role is option. Use change_path for the proposed route and status_quo for keeping the current route.' },
};

const edgeProperties = {
  id: { type: 'string' },
  sourceId: { type: 'string' },
  targetId: { type: 'string' },
  type: { type: 'string', enum: relationshipTypes },
  rationale: { type: 'string' },
};

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  base('get_riskframe_context', 0, 'Read app protocol'),
  {
    ...base('initialize_decision_graph', 0, 'Initialize decision graph'),
    inputSchema: {
      type: 'object',
      properties: {
        schemaVersion: { type: 'number', const: 1 },
        decision: {
          type: 'object',
          properties: {
            originalText: { type: 'string' },
            normalizedQuestion: { type: 'string' },
            objective: { type: 'string' },
            timeHorizon: { type: 'string' },
          },
          required: ['originalText', 'normalizedQuestion', 'objective'],
        },
        nodes: { type: 'array', minItems: 2, maxItems: 16, items: { type: 'object', properties: nodeProperties, required: ['id', 'role', 'label', 'detail', 'epistemicStatus', 'basis', 'sourceRefIds'] } },
        edges: { type: 'array', items: { type: 'object', properties: edgeProperties, required: ['id', 'sourceId', 'targetId', 'type', 'rationale'] } },
        sourceRefs: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, excerpt: { type: 'string' }, url: { type: 'string' } }, required: ['id', 'title'] } },
      },
      required: ['schemaVersion', 'decision', 'nodes', 'edges', 'sourceRefs'],
    },
  },
  base('get_reasoning_graph', 0, 'Read visible graph'),
  base('get_pending_proposals', 0, 'Read draft proposals'),
  base('get_parking_lot', 0, 'Read parked ideas'),
  { ...base('propose_card', 0, 'Propose a grounded card'), inputSchema: { type: 'object', properties: nodeProperties, required: ['role', 'label', 'detail', 'epistemicStatus', 'basis', 'sourceRefIds'] } },
  { ...base('propose_link', 0, 'Propose a graph edge'), inputSchema: { type: 'object', properties: { sourceId: { type: 'string' }, targetId: { type: 'string' }, type: { type: 'string', enum: relationshipTypes }, reason: { type: 'string' } }, required: ['sourceId', 'targetId', 'type', 'reason'] } },
  { ...base('flag_conflict', 0, 'Flag a conflict'), inputSchema: { type: 'object', properties: { sourceId: { type: 'string' }, targetId: { type: 'string' }, reason: { type: 'string' } }, required: ['sourceId', 'targetId', 'reason'] } },
  { ...base('flag_fragile_path', 0, 'Flag a fragile path'), inputSchema: { type: 'object', properties: { cardIds: { type: 'array', items: { type: 'string' } }, reason: { type: 'string' } }, required: ['cardIds', 'reason'] } },
];

export function getToolNames() { return TOOL_DEFINITIONS.map((tool) => tool.name); }
export function getToolsForTier() { return TOOL_DEFINITIONS; }
