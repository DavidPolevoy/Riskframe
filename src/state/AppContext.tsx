import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { Action, AppState } from '../data/types';
import { demoDecisionGraph } from '../data/demoDecisionGraph';
import { buildStateFromSnapshot, createInitialState, reducer } from './reducer';
import { loadState, saveState, storageKey } from './storage';

const Context = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);
function loadInitialAppState() {
  const fallback = createInitialState();
  const loaded = localStorage.getItem(storageKey) === null ? fallback : loadState(fallback);
  return loaded.decision === null && loaded.cards.length === 0 && loaded.proposals.length === 0
    ? buildStateFromSnapshot(demoDecisionGraph)
    : loaded;
}
export function AppProvider({ children }: { children: React.ReactNode }) { const [state, dispatch] = useReducer(reducer, createInitialState(), loadInitialAppState); useEffect(() => saveState(state), [state]); return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>; }
export function useApp() { const value = useContext(Context); if (!value) throw new Error('useApp must be used within AppProvider'); return value; }
export function useLensOptions() { return useMemo(() => ['personal', 'startup', 'engineering'] as const, []); }
