import type { AppState, Telemetry } from '../data/types';
export function getStuckSignal(state: AppState): Telemetry {
  const step = state.steps.find((s) => s.id === state.focusId) ?? state.steps[0];
  if (!step) return { stepId: null, idleSeconds: 0, rewriteCount: 0, isBacktracking: false };
  const later = state.visitedStepIds.findIndex((id) => id === step.id) < state.visitedStepIds.length - 1;
  return { stepId: step.id, idleSeconds: Math.max(0, Math.floor((Date.now() - step.lastEditedAt) / 1000)), rewriteCount: step.editCount, isBacktracking: later && state.focusId === step.id };
}
