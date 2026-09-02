import type { AppState } from '../data/types';

export const storageKey = 'signal-loom-state-v2';

function isStoredAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const state = value as Partial<AppState>;
  return (
    state.schemaVersion === 1 &&
    (state.decision === null || typeof state.decision === 'object') &&
    Array.isArray(state.cards) &&
    Array.isArray(state.proposals) &&
    Array.isArray(state.proposedLinks) &&
    Array.isArray(state.parkingLot) &&
    Array.isArray(state.rejected) &&
    Array.isArray(state.sourceRefs)
  );
}

export function loadState(fallback: AppState): AppState {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    return isStoredAppState(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    localStorage.removeItem(storageKey);
  }
}
