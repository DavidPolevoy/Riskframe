import type { DecisionGraphSnapshot, DecisionEdgeInput, DecisionNodeInput, OptionPath } from '../domain/decisionGraph';

export function node(
  id: string,
  role: DecisionNodeInput['role'],
  label: string,
  epistemicStatus: DecisionNodeInput['epistemicStatus'] = 'inferred',
  basis = 'Inferred from the user decision statement.',
  sourceRefIds: string[] = [],
  optionPath?: OptionPath,
): DecisionNodeInput {
  return {
    id,
    role,
    label,
    detail: `${label} detail`,
    epistemicStatus,
    basis,
    sourceRefIds,
    optionPath,
  };
}

export function edge(
  id: string,
  sourceId: string,
  targetId: string,
  type: DecisionEdgeInput['type'],
): DecisionEdgeInput {
  return {
    id,
    sourceId,
    targetId,
    type,
    rationale: `${sourceId} ${type} ${targetId}`,
  };
}

export const validSnapshot: DecisionGraphSnapshot = {
  schemaVersion: 1,
  decision: {
    originalText: 'Should we ship now or validate onboarding first?',
    normalizedQuestion: 'Ship now or run onboarding validation first?',
    objective: 'Reduce launch risk without unnecessary delay',
    timeHorizon: 'two weeks',
  },
  nodes: [
    node('option-ship', 'option', 'Ship now', 'inferred', 'Inferred from the proposed route.', [], 'change_path'),
    node('option-validate', 'option', 'Validate first', 'inferred', 'Inferred as the baseline/status-quo route.', [], 'status_quo'),
    node('risk-ship-adoption', 'risk', 'Ship adoption risk', 'forecast', 'Likely outcome under launch uncertainty.'),
    node('risk-validate-delay', 'risk', 'Validation delay risk', 'forecast', 'Likely outcome if validation consumes the launch window.'),
    node('mitigation-ship-monitoring', 'mitigation', 'Watch activation quality', 'inferred', 'Mitigation inferred from the launch risk.'),
    node('tripwire-validate-window', 'tripwire', 'Validation window expires', 'inferred', 'Tripwire inferred from the delay risk.'),
    node('criterion-learning', 'criterion', 'Learning quality', 'user_stated', ''),
  ],
  edges: [
    edge('root-ship', 'decision-root', 'option-ship', 'option_for'),
    edge('root-validate', 'decision-root', 'option-validate', 'option_for'),
    edge('ship-criterion', 'option-ship', 'criterion-learning', 'evaluated_by'),
    edge('validate-criterion', 'option-validate', 'criterion-learning', 'evaluated_by'),
    edge('ship-risk', 'option-ship', 'risk-ship-adoption', 'risks'),
    edge('validate-risk', 'option-validate', 'risk-validate-delay', 'risks'),
    edge('ship-risk-mitigation', 'risk-ship-adoption', 'mitigation-ship-monitoring', 'mitigated_by'),
    edge('validate-risk-tripwire', 'risk-validate-delay', 'tripwire-validate-window', 'monitored_by'),
  ],
  sourceRefs: [],
};
