import type { AppState } from '../data/types';
const key = 'rubber-duck-state-v1';
export function loadState(fallback: AppState): AppState { try { const raw = localStorage.getItem(key); return raw ? { ...fallback, ...JSON.parse(raw) } : fallback; } catch { return fallback; } }
export function saveState(state: AppState) { try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* storage is optional */ } }
