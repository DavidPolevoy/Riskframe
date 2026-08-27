import { describe, expect, it } from 'vitest';
import problems from '../data/problems.json';
import { createInitialState, reducer } from '../state/reducer';
import type { Problem } from '../data/types';

const initial = () => createInitialState(problems[0] as Problem);
describe('study reducer', () => {
  it('ships five seed problems with rubric milestones', () => { expect(problems).toHaveLength(5); expect(problems.every((p) => p.milestones.length === 3)).toBe(true); });
  it('spends exactly one token to unlock one rung', () => { const next = reducer(initial(), { type: 'spendHint' }); expect(next.hintTokens).toBe(2); expect(next.unlockedTier).toBe(1); });
  it('edits, flags, checks, and deletes steps without dangling annotations', () => { let s = initial(); s = reducer(s, { type: 'updateStep', stepId: 'step-1', text: 'try a map' }); s = reducer(s, { type: 'askQuestion', stepId: 'step-1', text: 'What could you look up?' }); s = reducer(s, { type: 'placeFlag', stepId: 'step-1' }); expect(s.steps[0].status).toBe('flagged'); expect(s.annotations).toHaveLength(2); s = reducer(s, { type: 'addStep' }); s = reducer(s, { type: 'deleteStep', stepId: 'step-1' }); expect(s.annotations).toHaveLength(0); });
});
