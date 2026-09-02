import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { Action, AppState } from '../data/types';
import { demoDecisionGraph } from '../data/demoDecisionGraph';
import { buildStateFromSnapshot, createInitialState, reducer } from './reducer';
import { loadState, saveState } from './storage';

const Context = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);
function loadInitialAppState(initialState?: AppState) {
  const fallback = createInitialState();
  const loaded = initialState ?? loadState(fallback);
  return loaded.decision === null && loaded.cards.length === 0 && loaded.proposals.length === 0
    ? buildStateFromSnapshot(demoDecisionGraph)
    : loaded;
}
export function AppProvider({ children, initialState }: { children: React.ReactNode; initialState?: AppState }) { const [state, dispatch] = useReducer(reducer, initialState, loadInitialAppState); useEffect(() => saveState(state), [state]); return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>; }
export function useApp() { const value = useContext(Context); if (!value) throw new Error('useApp must be used within AppProvider'); return value; }
export function useLensOptions() { return useMemo(() => ['personal', 'startup', 'engineering'] as const, []); }
