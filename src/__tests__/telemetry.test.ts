import { describe, expect, it } from 'vitest';
import { createInitialState, reducer } from '../state/reducer';
import { getStuckSignal } from '../state/telemetry';
import problems from '../data/problems.json';
describe('stuck telemetry', () => { it('reports focused step and rewrite count', () => { let s = createInitialState(problems[0]); s = reducer(s, { type: 'updateStep', stepId: 'step-1', text: 'a' }); s = reducer(s, { type: 'updateStep', stepId: 'step-1', text: 'b' }); const signal = getStuckSignal(s); expect(signal.stepId).toBe('step-1'); expect(signal.rewriteCount).toBe(1); }); });
