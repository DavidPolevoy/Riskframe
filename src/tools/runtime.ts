import type { Action, AppState } from '../data/types';
import { getStuckSignal } from '../state/telemetry';
import type { ToolDefinition } from './definitions';

export interface ToolResult { content: [{ type: 'text'; text: string }]; }
export type Handler = (input: Record<string, string>) => ToolResult | Promise<ToolResult>;
const result = (text: string): ToolResult => ({ content: [{ type: 'text', text }] });
export function createToolHandlers(dispatch: (action: Action) => void, getState: () => AppState): Record<string, Handler> {
  const valid = (input: Record<string, string>) => getState().steps.some((step) => step.id === input.stepId);
  return {
    get_problem: () => result(JSON.stringify({ problem: getState().problem, milestones: getState().problem.milestones })),
    get_work: () => result(JSON.stringify(getState().steps.map(({ id, text, status }) => ({ id, text, status })))),
    get_focus: () => result(getState().focusId ?? 'null'),
    get_stuck_signal: () => result(JSON.stringify(getStuckSignal(getState()))),
    ask_question: (input) => valid(input) ? (dispatch({ type: 'askQuestion', stepId: input.stepId, text: input.text }), result('Question attached.')) : result('That step does not exist.'),
    place_flag: (input) => valid(input) ? (dispatch({ type: 'placeFlag', stepId: input.stepId }), result('Review flag placed.')) : result('That step does not exist.'),
    award_check: (input) => valid(input) ? (dispatch({ type: 'awardCheck', stepId: input.stepId }), result('Step marked as checked.')) : result('That step does not exist.'),
    give_analogy: (input) => valid(input) ? result('Use a structurally similar problem with different values and context; ask the learner to map the pattern themselves.') : result('That step does not exist.'),
    give_nudge: (input) => valid(input) ? result('Consider which data structure or invariant provides the property your next move needs.') : result('That step does not exist.'),
    reveal_next_step: (input) => valid(input) ? result('Write the smallest operation that updates your chosen structure for this step.') : result('That step does not exist.'),
  };
}

export function attachHandlers(definition: ToolDefinition, handlers: Record<string, Handler>): ToolDefinition { return { ...definition, execute: handlers[definition.name] }; }
