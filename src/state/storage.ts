import type { AppState } from '../data/types';

export const storageKey = 'signal-loom-state-v2';

export function loadState(fallback: AppState): AppState {
  return fallback;
}

export function saveState(_state: AppState) {
  localStorage.removeItem(storageKey);
}
