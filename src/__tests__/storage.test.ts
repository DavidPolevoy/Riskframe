import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState, reducer } from '../state/reducer';
import { loadState, saveState, storageKey } from '../state/storage';
import { validSnapshot } from './decisionGraphFixtures';

describe('state storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not load browser storage into a new Riskframe session', () => {
    const fallback = createInitialState();
    const state = reducer(createInitialState(), { type: 'initializeDecisionGraph', snapshot: validSnapshot });
    localStorage.setItem(storageKey, JSON.stringify(state));

    expect(loadState(fallback)).toBe(fallback);
  });

  it('does not persist session state to browser storage', () => {
    const state = reducer(createInitialState(), { type: 'initializeDecisionGraph', snapshot: validSnapshot });

    saveState(state);

    expect(localStorage.getItem(storageKey)).toBeNull();
  });
});
