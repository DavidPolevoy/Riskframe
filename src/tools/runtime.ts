import type { Action, AppState, LinkType } from '../data/types';
import { epistemicStatuses, optionPaths, relationshipTypes, semanticRoles, validateDecisionGraph } from '../domain/decisionGraph';
import type { EpistemicStatus, OptionPath, SemanticRole } from '../domain/decisionGraph';
import { buildStateFromSnapshot, cardExists, getGraphCoverage } from '../state/reducer';
import { getGraphSignal } from '../state/telemetry';
import type { ToolDefinition } from './definitions';
import { riskframeProtocol } from './protocol';

export interface ToolResult { content: [{ type: 'text'; text: string }]; }
export type ToolInput = unknown;
export type Handler = (input: ToolInput) => ToolResult | Promise<ToolResult>;

const result = (text: string): ToolResult => ({ content: [{ type: 'text', text }] });
const jsonResult = (value: unknown) => result(JSON.stringify(value));
const roleSet = new Set<string>(semanticRoles);
const epistemicSet = new Set<string>(epistemicStatuses);
const relationshipSet = new Set<string>(relationshipTypes);
const optionPathSet = new Set<string>(optionPaths);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function createToolHandlers(dispatch: (action: Action) => void, getState: () => AppState): Record<string, Handler> {
  const validCard = (cardId?: unknown) => typeof cardId === 'string' && cardExists(getState(), cardId);
  return {
    get_riskframe_context: () => jsonResult({
      ...riskframeProtocol,
      currentState: {
        initialized: getState().decision !== null,
        proposalCount: getState().proposals.length,
        acceptedCount: getState().cards.length,
        unknownCount: getGraphCoverage(getState()).unknownCount,
      },
    }),
    initialize_decision_graph: (input) => {
      const validation = validateDecisionGraph(input);
      if (!validation.ok) return jsonResult({ ok: false, errors: validation.errors });
      dispatch({ type: 'initializeDecisionGraph', snapshot: validation.value });
      return jsonResult({ ok: true, initialized: true, coverage: getGraphCoverage(buildStateFromSnapshot(validation.value)) });
    },
    get_reasoning_graph: () => {
      const { decision, lens, cards, links, proposals, proposedLinks, parkingLot, rejected, sourceRefs, conflicts, fragilePaths } = getState();
      return jsonResult({
        decision,
        lens,
        cards,
        links,
        proposals,
        proposedLinks,
        parkingLot,
        rejected,
        sourceRefs,
        conflicts,
        fragilePaths,
        coverage: getGraphCoverage(getState()),
        protocol: riskframeProtocol,
        signal: getGraphSignal(getState()),
      });
    },
    get_pending_proposals: () => jsonResult({ cards: getState().proposals, links: getState().proposedLinks }),
    get_parking_lot: () => jsonResult(getState().parkingLot),
    propose_card: (input) => {
      const fields = asRecord(input);
      if (!roleSet.has(String(fields.role))) return result('That semantic role is not supported.');
      if (!epistemicSet.has(String(fields.epistemicStatus))) return result('That epistemic status is not supported.');
      const status = String(fields.epistemicStatus);
      const basis = String(fields.basis ?? '');
      const sourceRefIds = asStringArray(fields.sourceRefIds);
      if ((status === 'inferred' || status === 'forecast') && !basis.trim()) return result('Inferences and forecasts require a basis.');
      if (status === 'sourced' && sourceRefIds.length === 0) return result('Sourced cards require sourceRefIds.');
      if (String(fields.role) === 'unknown' && status === 'sourced') return result('Unknown cards cannot be sourced.');
      const optionPath = typeof fields.optionPath === 'string' && optionPathSet.has(fields.optionPath) ? fields.optionPath as OptionPath : undefined;
      if (String(fields.role) === 'option' && !optionPath) return result('Option cards require optionPath: change_path, status_quo, or test_path.');
      dispatch({
        type: 'proposeCard',
        role: fields.role as SemanticRole,
        title: String(fields.label ?? ''),
        body: String(fields.detail ?? ''),
        epistemicStatus: fields.epistemicStatus as EpistemicStatus,
        basis,
        sourceRefIds,
        optionPath,
      });
      return jsonResult({ ok: true, proposed: true });
    },
    propose_link: (input) => {
      const fields = asRecord(input);
      if (!validCard(fields.sourceId) || !validCard(fields.targetId)) return result('A referenced card does not exist.');
      if (!relationshipSet.has(String(fields.type))) return result('That relationship type is not supported.');
      dispatch({ type: 'proposeLink', sourceId: String(fields.sourceId), targetId: String(fields.targetId), linkType: fields.type as LinkType, reason: String(fields.reason ?? '') });
      return jsonResult({ ok: true, proposed: true });
    },
    flag_conflict: (input) => {
      const fields = asRecord(input);
      if (!validCard(fields.sourceId) || !validCard(fields.targetId)) return result('A referenced card does not exist.');
      dispatch({ type: 'flagConflict', sourceId: String(fields.sourceId), targetId: String(fields.targetId), reason: String(fields.reason ?? '') });
      return jsonResult({ ok: true, flagged: true });
    },
    flag_fragile_path: (input) => {
      const fields = asRecord(input);
      const ids = Array.isArray(fields.cardIds) ? asStringArray(fields.cardIds) : String(fields.cardIds ?? '').split(',').map((id) => id.trim()).filter(Boolean);
      if (ids.length === 0 || ids.some((id) => !validCard(id))) return result('One or more cards do not exist.');
      dispatch({ type: 'flagFragilePath', cardIds: ids, reason: String(fields.reason ?? '') });
      return jsonResult({ ok: true, flagged: true });
    },
  };
}

export function attachHandlers(definition: ToolDefinition, handlers: Record<string, Handler>): ToolDefinition { return { ...definition, execute: handlers[definition.name] }; }
