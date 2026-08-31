import { describe, expect, it, vi } from 'vitest';
import { TOOL_DEFINITIONS, getToolNames } from '../tools/definitions';
import { createToolHandlers } from '../tools/runtime';
import { registerToolSet } from '../tools/useTool';
import { createInitialState, reducer } from '../state/reducer';
import { validSnapshot } from './decisionGraphFixtures';

describe('Riskframe WebMCP tool surface', () => {
  it('exposes atomic initialization and graph follow-up tools only', () => {
    expect(getToolNames()).toEqual([
      'get_riskframe_context',
      'initialize_decision_graph',
      'get_reasoning_graph',
      'get_pending_proposals',
      'get_parking_lot',
      'propose_card',
      'propose_link',
      'flag_conflict',
      'flag_fragile_path',
    ]);
    expect(getToolNames()).not.toContain('start_decision');
    expect(getToolNames()).not.toContain('score_confidence');
    expect(getToolNames()).not.toContain('write_decision_summary');
  });

  it('exposes Riskframe protocol context for connected ChatGPT sessions', async () => {
    const dispatch = vi.fn();
    const handlers = createToolHandlers(dispatch, () => createInitialState());

    const response = await handlers.get_riskframe_context({});
    const context = JSON.parse(response.content[0].text);

    expect(context).toMatchObject({
      app: 'Riskframe',
      purpose: 'WebMCP-native visual decision graph',
      toolSurface: 'v2',
      preferredWorkflow: expect.arrayContaining([
        'fetch WebMCP tools from this page before live app testing',
        'call initialize_decision_graph for new decisions',
        'call get_reasoning_graph after mutations',
        'verify live app state through WebMCP before claiming behavior',
      ]),
      agentRules: expect.arrayContaining([
        'Treat this open page as the source of truth for live Riskframe testing.',
        'Every initialized graph must compare at least one change_path option against at least one status_quo option.',
        'Do not use numeric confidence.',
      ]),
    });
    expect(JSON.stringify(context)).toContain('status_quo');
  });

  it('rejects invalid initialization payloads without dispatching', async () => {
    const dispatch = vi.fn();
    const handlers = createToolHandlers(dispatch, () => createInitialState());

    const rejected = await handlers.initialize_decision_graph({ schemaVersion: 1 });

    expect(JSON.parse(rejected.content[0].text)).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ code: 'invalid_decision' })]),
    });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('dispatches a validated decision graph snapshot atomically', async () => {
    const dispatch = vi.fn();
    const handlers = createToolHandlers(dispatch, () => createInitialState());

    const accepted = await handlers.initialize_decision_graph(validSnapshot);

    expect(JSON.parse(accepted.content[0].text)).toMatchObject({
      ok: true,
      initialized: true,
      coverage: {
        options: expect.arrayContaining([
          expect.objectContaining({ optionId: 'option-ship', optionPath: 'change_path' }),
          expect.objectContaining({ optionId: 'option-validate', optionPath: 'status_quo' }),
        ]),
      },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'initializeDecisionGraph',
      snapshot: validSnapshot,
    });
  });

  it('returns content envelopes for graph reads and grounded proposal mutations', async () => {
    const dispatch = vi.fn();
    const state = reducer(createInitialState(), { type: 'initializeDecisionGraph', snapshot: validSnapshot });
    const handlers = createToolHandlers(dispatch, () => state);

    const read = await handlers.get_reasoning_graph({});
    const proposal = await handlers.propose_card({
      role: 'claim',
      label: 'The current idea is too generic',
      detail: 'This needs evidence from the challenge criteria.',
      epistemicStatus: 'inferred',
      basis: 'Raised by reviewing the visible graph.',
      sourceRefIds: [],
    });

    expect(read).toHaveProperty('content.0.type', 'text');
    expect(JSON.parse(read.content[0].text)).toMatchObject({
      coverage: expect.any(Object),
      protocol: expect.objectContaining({
        preferredWorkflow: expect.arrayContaining(['call get_reasoning_graph after mutations']),
      }),
    });
    expect(proposal).toHaveProperty('content.0.type', 'text');
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'proposeCard', role: 'claim' }),
    );
  });

  it('exposes optionPath in tool schemas and proposal dispatches', async () => {
    expect(JSON.stringify(TOOL_DEFINITIONS)).toContain('optionPath');
    expect(JSON.stringify(TOOL_DEFINITIONS)).toContain('change_path');
    expect(JSON.stringify(TOOL_DEFINITIONS)).toContain('status_quo');

    const dispatch = vi.fn();
    const handlers = createToolHandlers(dispatch, () => createInitialState());

    const accepted = await handlers.propose_card({
      role: 'option',
      label: 'Keep current route',
      detail: 'Continue with the existing project direction.',
      epistemicStatus: 'inferred',
      basis: 'Baseline inferred from the current project route.',
      sourceRefIds: [],
      optionPath: 'status_quo',
    });

    expect(JSON.parse(accepted.content[0].text)).toMatchObject({ ok: true, proposed: true });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'proposeCard', role: 'option', optionPath: 'status_quo' }),
    );
  });

  it('rejects proposed links when either endpoint is missing', async () => {
    const dispatch = vi.fn();
    const state = reducer(createInitialState(), { type: 'initializeDecisionGraph', snapshot: validSnapshot });
    const handlers = createToolHandlers(dispatch, () => state);

    const invalid = await handlers.propose_link({
      sourceId: 'missing-a',
      targetId: 'missing-b',
      type: 'supports',
      reason: 'They depend on each other.',
    });

    expect(invalid.content[0].text).toMatch(/does not exist/i);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not register the same tool name twice when cleanup is unavailable', async () => {
    const context = { registerTool: vi.fn() };
    const tool = TOOL_DEFINITIONS[0];
    await registerToolSet(context, [tool]);
    await registerToolSet(context, [tool]);
    expect(context.registerTool).toHaveBeenCalledTimes(1);
  });
});
