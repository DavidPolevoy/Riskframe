import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState, reducer } from '../state/reducer';
import { loadState, saveState, storageKey } from '../state/storage';
import { validSnapshot } from './decisionGraphFixtures';

describe('state storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads only v2 schema-aware Riskframe state', () => {
    const fallback = createInitialState();
    localStorage.setItem('signal-loom-state-v1', JSON.stringify({ cards: [{ id: 'legacy' }], proposals: [] }));

    expect(loadState(fallback)).toBe(fallback);

    const state = reducer(createInitialState(), { type: 'initializeDecisionGraph', snapshot: validSnapshot });
    localStorage.setItem(storageKey, JSON.stringify(state));

    expect(loadState(fallback)).toEqual(state);
  });

  it('saves state under the v2 key', () => {
    const state = reducer(createInitialState(), { type: 'initializeDecisionGraph', snapshot: validSnapshot });

    saveState(state);

    expect(JSON.parse(localStorage.getItem(storageKey) ?? 'null')).toEqual(state);
  });
});
