import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import problems from '../data/problems.json';
import type { Action, AppState, Problem } from '../data/types';
import { createInitialState, reducer } from './reducer';
import { loadState, saveState } from './storage';

const Context = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);
export function AppProvider({ children, problem = problems[0] as Problem }: { children: React.ReactNode; problem?: Problem }) { const [state, dispatch] = useReducer(reducer, createInitialState(problem), loadState); useEffect(() => saveState(state), [state]); return <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>; }
export function useApp() { const value = useContext(Context); if (!value) throw new Error('useApp must be used within AppProvider'); return value; }
export function useProblemList() { return useMemo(() => problems as Problem[], []); }
