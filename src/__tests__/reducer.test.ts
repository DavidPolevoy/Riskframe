import { describe, expect, it } from 'vitest';
import { DECISION_ROOT_ID } from '../domain/decisionGraph';
import { createInitialState, getGraphCoverage, reducer } from '../state/reducer';
import { edge, node, validSnapshot } from './decisionGraphFixtures';

describe('reasoning graph reducer', () => {
  it('initializes the graph atomically from a validated ChatGPT snapshot', () => {
    const state = reducer(createInitialState(), {
      type: 'initializeDecisionGraph',
      snapshot: validSnapshot,
    });

    expect(state.schemaVersion).toBe(1);
    expect(state.decision).toEqual(validSnapshot.decision);
    expect(state.cards[0]).toMatchObject({
      id: DECISION_ROOT_ID,
      role: 'decision',
      reviewStatus: 'accepted',
      epistemicStatus: 'user_stated',
    });
    expect(state.proposals.map((card) => card.title)).toEqual([
      'Ship now',
      'Validate first',
      'Ship adoption risk',
      'Validation delay risk',
      'Watch activation quality',
      'Validation window expires',
      'Learning quality',
    ]);
    expect(state.proposals.find((card) => card.id === 'option-ship')?.optionPath).toBe('change_path');
    expect(state.proposals.find((card) => card.id === 'option-validate')?.optionPath).toBe('status_quo');
    expect(state.proposals.every((card) => card.reviewStatus === 'draft')).toBe(true);
    expect(JSON.stringify(state)).not.toMatch(/Continue with the current direction|Pivot to a stronger concept/);
  });

  it('lays out initialized roles in deterministic lanes', () => {
    const state = reducer(createInitialState(), {
      type: 'initializeDecisionGraph',
      snapshot: {
        ...validSnapshot,
        nodes: [
          node('option-a', 'option', 'Option A', 'inferred', 'Inferred from the proposed route.', [], 'change_path'),
          node('option-b', 'option', 'Option B', 'inferred', 'Inferred as the baseline route.', [], 'status_quo'),
          node('risk-a', 'risk', 'Risk A', 'forecast', 'Forecast from option A.'),
          node('risk-b', 'risk', 'Risk B', 'forecast', 'Forecast from option B.'),
          node('mitigation-a', 'mitigation', 'Mitigation A'),
          node('tripwire-b', 'tripwire', 'Tripwire B'),
          node('constraint-a', 'constraint', 'Budget limit', 'user_stated', ''),
          node('claim-a', 'claim', 'Market claim'),
          node('unknown-a', 'unknown', 'Missing price data', 'unknown', ''),
        ],
        edges: [
          edge('root-a', DECISION_ROOT_ID, 'option-a', 'option_for'),
          edge('root-b', DECISION_ROOT_ID, 'option-b', 'option_for'),
          edge('option-a-risk', 'option-a', 'risk-a', 'risks'),
          edge('option-b-risk', 'option-b', 'risk-b', 'risks'),
          edge('risk-a-mitigation', 'risk-a', 'mitigation-a', 'mitigated_by'),
          edge('risk-b-tripwire', 'risk-b', 'tripwire-b', 'monitored_by'),
          edge('option-constraint', 'option-a', 'constraint-a', 'constrained_by'),
          edge('option-claim', 'option-a', 'claim-a', 'supports'),
          edge('option-unknown', 'option-b', 'unknown-a', 'depends_on'),
        ],
      },
    });

    expect(state.cards[0]).toMatchObject({ x: 360, y: 980 });
    expect(state.proposals.find((card) => card.id === 'option-a')).toMatchObject({ x: 980, y: 720 });
    expect(state.proposals.find((card) => card.id === 'option-b')).toMatchObject({ x: 980, y: 1160 });
    expect(state.proposals.find((card) => card.id === 'constraint-a')).toMatchObject({ x: 1620, y: 720 });
    expect(state.proposals.find((card) => card.id === 'claim-a')).toMatchObject({ x: 2240, y: 720 });
    expect(state.proposals.find((card) => card.id === 'unknown-a')).toMatchObject({ x: 2240, y: 960 });
  });

  it('accepts, parks, rejects, and promotes draft nodes without changing epistemic status', () => {
    let state = reducer(createInitialState(), { type: 'initializeDecisionGraph', snapshot: validSnapshot });
    const [first, second, third] = state.proposals;

    state = reducer(state, { type: 'acceptProposal', proposalId: first.id });
    expect(state.cards.some((card) => card.id === first.id && card.reviewStatus === 'accepted' && card.epistemicStatus === 'inferred')).toBe(true);

    state = reducer(state, { type: 'parkProposal', proposalId: second.id });
    expect(state.parkingLot.some((card) => card.id === second.id && card.reviewStatus === 'parked')).toBe(true);

    state = reducer(state, { type: 'rejectProposal', proposalId: third.id });
    expect(state.rejected.some((card) => card.id === third.id && card.reviewStatus === 'rejected')).toBe(true);

    state = reducer(state, { type: 'promoteParked', cardId: second.id });
    expect(state.cards.some((card) => card.id === second.id && card.reviewStatus === 'accepted')).toBe(true);
    expect(state.parkingLot.some((card) => card.id === second.id)).toBe(false);
  });

  it('reports structural coverage without numeric model confidence', () => {
    const state = reducer(createInitialState(), { type: 'initializeDecisionGraph', snapshot: validSnapshot });

    expect(getGraphCoverage(state)).toEqual({
      options: [
        { optionId: 'option-ship', optionPath: 'change_path', missing: ['consequence', 'tripwire', 'support'] },
        { optionId: 'option-validate', optionPath: 'status_quo', missing: ['consequence', 'mitigation', 'support'] },
      ],
      unknownCount: 0,
    });
    expect(JSON.stringify(state)).not.toMatch(/confidence/);
  });

  it('tracks conflicts and fragile paths as visible analysis markers', () => {
    let state = reducer(createInitialState(), { type: 'initializeDecisionGraph', snapshot: validSnapshot });
    const [first, second] = state.proposals;
    state = reducer(state, { type: 'acceptProposal', proposalId: first.id });
    state = reducer(state, { type: 'parkProposal', proposalId: second.id });

    state = reducer(state, {
      type: 'flagConflict',
      sourceId: first.id,
      targetId: second.id,
      reason: 'Accepted plan conflicts with a parked concern.',
    });
    state = reducer(state, {
      type: 'flagFragilePath',
      cardIds: [DECISION_ROOT_ID, first.id],
      reason: 'The decision depends on one weak assumption.',
    });

    expect(state.conflicts).toHaveLength(1);
    expect(state.fragilePaths).toHaveLength(1);
  });
});
