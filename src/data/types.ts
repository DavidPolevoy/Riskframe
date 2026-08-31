import type {
  DecisionFrame,
  DecisionGraphSnapshot,
  EpistemicStatus,
  OptionPath,
  RelationshipType,
  SemanticRole,
  SourceRef,
} from '../domain/decisionGraph';

export type DecisionLens = 'personal' | 'startup' | 'engineering';
export type CardType = SemanticRole | 'decision';
export type ReviewStatus = 'accepted' | 'draft' | 'parked' | 'rejected';
export type LinkType = RelationshipType;

export interface ReasoningCard {
  id: string;
  role: CardType;
  title: string;
  body: string;
  reviewStatus: ReviewStatus;
  epistemicStatus: EpistemicStatus;
  basis: string;
  sourceRefIds: string[];
  optionPath?: OptionPath;
  x: number;
  y: number;
  createdAt: number;
  updatedAt: number;
}

export interface ReasoningLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: LinkType;
  reason: string;
  reviewStatus: 'accepted' | 'draft';
}

export interface AnalysisMarker {
  id: string;
  sourceId: string;
  targetId?: string;
  cardIds?: string[];
  reason: string;
  createdAt: number;
}

export interface CoverageItem {
  optionId: string;
  optionPath?: OptionPath;
  missing: Array<'consequence' | 'risk' | 'mitigation' | 'tripwire' | 'support'>;
}

export interface GraphCoverage {
  options: CoverageItem[];
  unknownCount: number;
}

export interface AppState {
  schemaVersion: 1;
  decision: DecisionFrame | null;
  lens: DecisionLens;
  cards: ReasoningCard[];
  links: ReasoningLink[];
  proposals: ReasoningCard[];
  proposedLinks: ReasoningLink[];
  parkingLot: ReasoningCard[];
  rejected: ReasoningCard[];
  sourceRefs: SourceRef[];
  conflicts: AnalysisMarker[];
  fragilePaths: AnalysisMarker[];
  summary: string;
  selectedCardId: string | null;
}

export type Action =
  | { type: 'initializeDecisionGraph'; snapshot: DecisionGraphSnapshot }
  | { type: 'updateDecision'; text: string }
  | { type: 'setLens'; lens: DecisionLens }
  | { type: 'selectCard'; cardId: string | null }
  | { type: 'acceptProposal'; proposalId: string }
  | { type: 'parkProposal'; proposalId: string }
  | { type: 'rejectProposal'; proposalId: string }
  | { type: 'promoteParked'; cardId: string }
  | {
      type: 'proposeCard';
      role: SemanticRole;
      title: string;
      body: string;
      epistemicStatus: EpistemicStatus;
      basis: string;
      sourceRefIds: string[];
      optionPath?: OptionPath;
    }
  | { type: 'proposeLink'; sourceId: string; targetId: string; linkType: LinkType; reason: string }
  | { type: 'flagConflict'; sourceId: string; targetId: string; reason: string }
  | { type: 'flagFragilePath'; cardIds: string[]; reason: string }
  | { type: 'resetSession' };
