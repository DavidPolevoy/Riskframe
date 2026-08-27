import { describe, expect, it, vi } from 'vitest';
import { TOOL_DEFINITIONS, getToolsForTier } from '../tools/definitions';
import { createToolHandlers } from '../tools/runtime';
import { createInitialState } from '../state/reducer';
import problems from '../data/problems.json';

describe('WebMCP tool surface', () => {
  it('keeps tier zero readable and gates one stronger rung per token', () => {
    expect(getToolsForTier(0).map((tool) => tool.name)).toEqual(expect.arrayContaining(['get_problem', 'get_work', 'ask_question']));
    expect(getToolsForTier(0).some((tool) => tool.name === 'give_analogy')).toBe(false);
    expect(getToolsForTier(1).some((tool) => tool.name === 'give_analogy')).toBe(true);
    expect(getToolsForTier(1).some((tool) => tool.name === 'give_nudge')).toBe(false);
  });

  it('returns the required content envelope for reads and invalid mutations', async () => {
    const dispatch = vi.fn();
    const state = createInitialState(problems[0]);
    const handlers = createToolHandlers(dispatch, () => state);
    const read = await handlers.get_problem({});
    const invalid = await handlers.place_flag({ stepId: 'missing' });
    expect(read).toHaveProperty('content.0.type', 'text');
    expect(invalid).toHaveProperty('content.0.type', 'text');
    expect(dispatch).not.toHaveBeenCalled();
  });
});
