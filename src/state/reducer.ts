import type { Action, AppState } from '../data/types';

const now = () => Date.now();
export function createInitialState(problem: AppState['problem']): AppState {
  return { problem, steps: [{ id: 'step-1', text: '', status: 'draft', lastEditedAt: now(), editCount: 0 }], focusId: 'step-1', annotations: [], hintTokens: 3, unlockedTier: 0, telemetry: {}, visitedStepIds: [] };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'addStep': { const id = `step-${state.steps.length + 1}-${now()}`; return { ...state, steps: [...state.steps, { id, text: '', status: 'draft', lastEditedAt: now(), editCount: 0 }] }; }
    case 'updateStep': { const index = state.steps.findIndex((s) => s.id === action.stepId); if (index < 0) return state; const steps = state.steps.map((s) => s.id === action.stepId ? { ...s, text: action.text, lastEditedAt: now(), editCount: s.editCount + (s.text.trim() && s.text !== action.text ? 1 : 0) } : s); const visited = state.visitedStepIds.includes(action.stepId) ? state.visitedStepIds : [...state.visitedStepIds, action.stepId]; return { ...state, steps, visitedStepIds: visited }; }
    case 'deleteStep': { if (state.steps.length === 1) return state; const steps = state.steps.filter((s) => s.id !== action.stepId); return { ...state, steps, focusId: state.focusId === action.stepId ? steps[0]?.id ?? null : state.focusId, annotations: state.annotations.filter((a) => a.stepId !== action.stepId) }; }
    case 'moveStep': { const i = state.steps.findIndex((s) => s.id === action.stepId); const j = action.direction === 'up' ? i - 1 : i + 1; if (i < 0 || j < 0 || j >= state.steps.length) return state; const steps = [...state.steps]; [steps[i], steps[j]] = [steps[j], steps[i]]; return { ...state, steps }; }
    case 'setFocus': return { ...state, focusId: action.stepId };
    case 'spendHint': return state.hintTokens <= 0 ? state : { ...state, hintTokens: state.hintTokens - 1, unlockedTier: Math.min(3, state.unlockedTier + 1) };
    case 'askQuestion': return state.steps.some((s) => s.id === action.stepId) ? { ...state, annotations: [...state.annotations, { id: `annotation-${now()}`, stepId: action.stepId, kind: 'question', text: action.text, createdAt: now() }] } : state;
    case 'placeFlag': return state.steps.some((s) => s.id === action.stepId) ? { ...state, steps: state.steps.map((s) => s.id === action.stepId ? { ...s, status: 'flagged' } : s), annotations: [...state.annotations, { id: `annotation-${now()}`, stepId: action.stepId, kind: 'flag', text: '', createdAt: now() }] } : state;
    case 'awardCheck': return state.steps.some((s) => s.id === action.stepId) ? { ...state, steps: state.steps.map((s) => s.id === action.stepId ? { ...s, status: 'checked' } : s) } : state;
  }
}
