import { describe, expect, it } from 'vitest';
import { createInitialState, reducer } from '../state/reducer';
import { getGraphSignal } from '../state/telemetry';
import { validSnapshot } from './decisionGraphFixtures';

describe('graph telemetry', () => {
  it('reports visible reasoning surface counts and coverage', () => {
    let state = reducer(createInitialState(), { type: 'initializeDecisionGraph', snapshot: validSnapshot });
    state = reducer(state, { type: 'acceptProposal', proposalId: state.proposals[0].id });
    state = reducer(state, { type: 'parkProposal', proposalId: state.proposals[0].id });

    expect(getGraphSignal(state)).toMatchObject({
      acceptedCount: 2,
      proposalCount: 5,
      parkedCount: 1,
      coverage: {
        unknownCount: 0,
        options: expect.arrayContaining([
          expect.objectContaining({ optionId: 'option-ship', optionPath: 'change_path', missing: expect.arrayContaining(['tripwire']) }),
          expect.objectContaining({ optionId: 'option-validate', optionPath: 'status_quo', missing: expect.arrayContaining(['mitigation']) }),
        ]),
      },
    });
  });
});
