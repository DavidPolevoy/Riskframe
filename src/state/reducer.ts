import type { Action, AppState, CardType, GraphCoverage, LinkType, ReasoningCard, ReasoningLink, ReviewStatus } from '../data/types';
import { DECISION_ROOT_ID } from '../domain/decisionGraph';
import type { DecisionFrame, DecisionGraphSnapshot, DecisionNodeInput, EpistemicStatus, OptionPath, SemanticRole } from '../domain/decisionGraph';

const now = () => Date.now();

const roleLayout: Record<CardType, { x: number; y: number }> = {
  decision: { x: 360, y: 980 },
  option: { x: 980, y: 720 },
  criterion: { x: 1620, y: 720 },
  constraint: { x: 1620, y: 720 },
  consequence: { x: 1620, y: 1200 },
  risk: { x: 1620, y: 1440 },
  mitigation: { x: 2240, y: 1320 },
  tripwire: { x: 2240, y: 1560 },
  claim: { x: 2240, y: 720 },
  unknown: { x: 2240, y: 960 },
};

const optionPathY: Record<OptionPath, number> = {
  change_path: 720,
  status_quo: 1160,
  test_path: 1600,
};

function card(
  id: string,
  role: CardType,
  title: string,
  body: string,
  reviewStatus: ReviewStatus,
  epistemicStatus: EpistemicStatus,
  basis: string,
  sourceRefIds: string[],
  x: number,
  y: number,
  optionPath?: OptionPath,
): ReasoningCard {
  const timestamp = now();
  return { id, role, title, body, reviewStatus, epistemicStatus, basis, sourceRefIds, optionPath, x, y, createdAt: timestamp, updatedAt: timestamp };
}

function decisionRootCard(decision: DecisionFrame) {
  const { x, y } = roleLayout.decision;
  return card(
    DECISION_ROOT_ID,
    'decision',
    decision.normalizedQuestion,
    decision.originalText,
    'accepted',
    'user_stated',
    'Original decision statement supplied by the user.',
    [],
    x,
    y,
  );
}

function layoutForNode(node: DecisionNodeInput, index: number, nodes: DecisionNodeInput[]) {
  if (node.role === 'option' && node.optionPath) {
    const samePathIndex = nodes.slice(0, index).filter((item) => item.role === 'option' && item.optionPath === node.optionPath).length;
    return { x: roleLayout.option.x, y: optionPathY[node.optionPath] + samePathIndex * 240 };
  }
  const sameRoleIndex = nodes.slice(0, index).filter((item) => item.role === node.role).length;
  const base = roleLayout[node.role];
  return { x: base.x, y: base.y + sameRoleIndex * 240 };
}

function draftCard(node: DecisionNodeInput, index: number, nodes: DecisionNodeInput[]) {
  const { x, y } = layoutForNode(node, index, nodes);
  return card(node.id, node.role, node.label, node.detail, 'draft', node.epistemicStatus, node.basis, node.sourceRefIds, x, y, node.optionPath);
}

function toReasoningLink(edge: DecisionGraphSnapshot['edges'][number]): ReasoningLink {
  return {
    id: edge.id,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    type: edge.type,
    reason: edge.rationale,
    reviewStatus: 'draft',
  };
}

export function createInitialState(): AppState {
  return {
    schemaVersion: 1,
    decision: null,
    lens: 'startup',
    cards: [],
    links: [],
    proposals: [],
    proposedLinks: [],
    parkingLot: [],
    rejected: [],
    sourceRefs: [],
    conflicts: [],
    fragilePaths: [],
    summary: '',
    selectedCardId: null,
  };
}

export function buildStateFromSnapshot(snapshot: DecisionGraphSnapshot): AppState {
  return {
    ...createInitialState(),
    decision: snapshot.decision,
    cards: [decisionRootCard(snapshot.decision)],
    proposals: snapshot.nodes.map(draftCard),
    proposedLinks: snapshot.edges.map(toReasoningLink),
    sourceRefs: snapshot.sourceRefs,
    selectedCardId: DECISION_ROOT_ID,
  };
}

function moveProposal(state: AppState, proposalId: string, reviewStatus: ReviewStatus, target: 'cards' | 'parkingLot' | 'rejected'): AppState {
  const proposal = state.proposals.find((item) => item.id === proposalId);
  if (!proposal) return state;
  const updated = { ...proposal, reviewStatus, updatedAt: now() };
  return {
    ...state,
    proposals: state.proposals.filter((item) => item.id !== proposalId),
    [target]: [...state[target], updated],
  };
}

function allCards(state: AppState) {
  return [...state.cards, ...state.proposals, ...state.parkingLot, ...state.rejected];
}

function graphCards(state: AppState) {
  return [...state.cards, ...state.proposals, ...state.parkingLot];
}

function allCardIds(state: AppState) {
  return new Set(allCards(state).map((item) => item.id));
}

function graphLinks(state: AppState) {
  return [...state.links, ...state.proposedLinks];
}

export function cardExists(state: AppState, cardId: string) {
  return allCardIds(state).has(cardId);
}

function optionHasTargetRole(state: AppState, optionId: string, role: CardType) {
  const cardsById = new Map(graphCards(state).map((item) => [item.id, item]));
  return graphLinks(state).some((link) => link.sourceId === optionId && cardsById.get(link.targetId)?.role === role);
}

function optionHasSupport(state: AppState, optionId: string) {
  return graphLinks(state).some((link) => link.sourceId === optionId && link.type === 'supports');
}

function optionRiskIds(state: AppState, optionId: string) {
  const cardsById = new Map(graphCards(state).map((item) => [item.id, item]));
  return graphLinks(state)
    .filter((link) => link.sourceId === optionId && link.type === 'risks' && cardsById.get(link.targetId)?.role === 'risk')
    .map((link) => link.targetId);
}

function risksHaveManagement(state: AppState, riskIds: string[], role: 'mitigation' | 'tripwire') {
  if (riskIds.length === 0) return false;
  const cardsById = new Map(graphCards(state).map((item) => [item.id, item]));
  const expectedType = role === 'mitigation' ? 'mitigated_by' : 'monitored_by';
  return riskIds.some((riskId) => graphLinks(state).some((link) => link.sourceId === riskId && link.type === expectedType && cardsById.get(link.targetId)?.role === role));
}

export function getGraphCoverage(state: AppState): GraphCoverage {
  return {
    options: graphCards(state)
      .filter((card) => card.role === 'option')
      .map((option) => {
        const missing: GraphCoverage['options'][number]['missing'] = [];
        const riskIds = optionRiskIds(state, option.id);
        if (!optionHasTargetRole(state, option.id, 'consequence')) missing.push('consequence');
        if (riskIds.length === 0) missing.push('risk');
        if (!risksHaveManagement(state, riskIds, 'mitigation')) missing.push('mitigation');
        if (!risksHaveManagement(state, riskIds, 'tripwire')) missing.push('tripwire');
        if (!optionHasSupport(state, option.id)) missing.push('support');
        return { optionId: option.id, optionPath: option.optionPath, missing };
      }),
    unknownCount: graphCards(state).filter((card) => card.role === 'unknown').length,
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'initializeDecisionGraph':
      return buildStateFromSnapshot(action.snapshot);
    case 'updateDecision':
      return {
        ...state,
        decision: state.decision
          ? { ...state.decision, originalText: action.text, normalizedQuestion: action.text || state.decision.normalizedQuestion }
          : { originalText: action.text, normalizedQuestion: action.text, objective: 'Unknown' },
      };
    case 'setLens':
      return { ...state, lens: action.lens };
    case 'selectCard':
      return { ...state, selectedCardId: action.cardId };
    case 'acceptProposal':
      return moveProposal(state, action.proposalId, 'accepted', 'cards');
    case 'parkProposal':
      return moveProposal(state, action.proposalId, 'parked', 'parkingLot');
    case 'rejectProposal':
      return moveProposal(state, action.proposalId, 'rejected', 'rejected');
    case 'promoteParked': {
      const parked = state.parkingLot.find((item) => item.id === action.cardId);
      if (!parked) return state;
      return {
        ...state,
        parkingLot: state.parkingLot.filter((item) => item.id !== action.cardId),
        cards: [...state.cards, { ...parked, reviewStatus: 'accepted', updatedAt: now() }],
      };
    }
    case 'proposeCard': {
      const role = action.role as SemanticRole;
      const optionPath = role === 'option' ? action.optionPath : undefined;
      const { x, y } = role === 'option' && optionPath ? { x: roleLayout.option.x, y: optionPathY[optionPath] } : roleLayout[role];
      const sameLaneCount = state.proposals.filter((item) => item.role === role && (role !== 'option' || item.optionPath === optionPath)).length;
      return {
        ...state,
        proposals: [
          ...state.proposals,
          card(
            `proposal-${role}-${now()}`,
            role,
            action.title,
            action.body,
            'draft',
            action.epistemicStatus,
            action.basis,
            action.sourceRefIds,
            x,
            y + sameLaneCount * 240,
            optionPath,
          ),
        ],
      };
    }
    case 'proposeLink':
      return {
        ...state,
        proposedLinks: [
          ...state.proposedLinks,
          {
            id: `proposal-link-${now()}`,
            sourceId: action.sourceId,
            targetId: action.targetId,
            type: action.linkType as LinkType,
            reason: action.reason,
            reviewStatus: 'draft',
          },
        ],
      };
    case 'flagConflict':
      return {
        ...state,
        conflicts: [...state.conflicts, { id: `conflict-${now()}`, sourceId: action.sourceId, targetId: action.targetId, reason: action.reason, createdAt: now() }],
      };
    case 'flagFragilePath':
      return {
        ...state,
        fragilePaths: [...state.fragilePaths, { id: `fragile-${now()}`, sourceId: action.cardIds[0] ?? DECISION_ROOT_ID, cardIds: action.cardIds, reason: action.reason, createdAt: now() }],
      };
    case 'resetSession':
      return createInitialState();
    default:
      return state;
  }
}
